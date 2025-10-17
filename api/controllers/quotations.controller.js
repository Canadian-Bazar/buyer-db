import { matchedData } from 'express-validator'
import Quotation from '../models/quotations.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import  httpStatus  from 'http-status';
import Product from '../models/products.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import { publishQuotationSentEvent } from '../redis/quotation-analytics.redis.js'
import Seller from '../models/seller.schema.js'
import sendMail from '../helpers/sendMail.js'



export const createQuotationController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { slug } = validatedData;

        const product = await Product.findOne({ slug });

        if (!product) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Product Not Found');
        }

        if(!validatedData.deadline){
            validatedData.deadline = null;
        }

        const existingQuotation = await Quotation.findOne({
            productId: product._id,
            buyer: req.user._id,
            status: { $in: ['pending', 'in-progress'] }
        });

        if (existingQuotation) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Quotation already pending for same product');
        }

        const newQuotation = await Quotation.create({
            ...validatedData,
            productId: product._id,
            buyer: req.user._id,
            seller: product.seller,
        });

        // 📤 Publish quotation sent event to seller-db analytics
        await publishQuotationSentEvent({
            quotationId: newQuotation._id,
            productId: product._id,
            sellerId: product.seller,
            buyerId: req.user._id,
            isService: false
        });

        // 📧 Send email notification to seller
        try {
            const seller = await Seller.findById(product.seller).select('companyName email').lean();
            if (seller && seller.email) {
                const dashboardUrl = `${process.env.SELLER_FRONTEND_URL || 'https://seller.canadian-bazaar.ca'}/quotations`;
                
                await sendMail(seller.email, 'inquiry-received.ejs', {
                    companyName: seller.companyName,
                    buyerName: req.user.fullName || 'A buyer',
                    productName: product.name,
                    quantity: validatedData.quantity || 'N/A',
                    requirements: validatedData.description || 'No specific requirements mentioned',
                    dashboardUrl: dashboardUrl,
                    subject: `New Inquiry Received for ${product.name}`
                });
            }
        } catch (emailError) {
            // Log but don't fail the request
            console.error('Failed to send inquiry notification email to seller:', emailError);
        }

        res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, 'Quotation Sent Successfully')
        );
    } catch (err) {
        handleError(res, err);
    }
};


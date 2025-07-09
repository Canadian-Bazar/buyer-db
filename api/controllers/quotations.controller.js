import { matchedData } from 'express-validator'
import Quotation from '../models/quotations.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import  httpStatus  from 'http-status';
import Product from '../models/products.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js';



export const createQuotationController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { slug } = validatedData;

        const product = await Product.findOne({ slug });

        if (!product) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Product Not Found');
        }

        const existingQuotation = await Quotation.findOne({
            productId: product._id,
            buyer: req.user._id,
            status: { $in: ['pending', 'in-progress'] }
        });

        if (existingQuotation) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Quotation already pending for same product');
        }

        await Quotation.create({
            ...validatedData,
            productId: product._id,
            buyer: req.user._id,
            seller: product.seller,
        });

        res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, 'Quotation Sent Successfully')
        );
    } catch (err) {
        handleError(res, err);
    }
};


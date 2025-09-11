import { matchedData } from 'express-validator'
import ServiceQuotation from '../models/service-quotations.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import  httpStatus  from 'http-status';
import Service from '../models/service.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import { publishQuotationSentEvent } from '../redis/quotation-analytics.redis.js'

export const createServiceQuotationController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { slug } = validatedData;

        const service = await Service.findOne({ slug });

        if (!service) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Service Not Found');
        }

        const existingQuotation = await ServiceQuotation.findOne({
            serviceId: service._id,
            buyer: req.user._id,
            status: { $in: ['pending', 'negotiation'] }
        });

        if (existingQuotation) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Service quotation already pending for same service');
        }

         if(!validatedData.deadline){
            validatedData.deadline = null;
        }

        const newServiceQuotation = await ServiceQuotation.create({
            ...validatedData,
            serviceId: service._id,
            buyer: req.user._id,
            seller: service.seller,
        });

        // 📤 Publish service quotation sent event to seller-db analytics  
        await publishQuotationSentEvent({
            quotationId: newServiceQuotation._id,
            serviceId: service._id,
            sellerId: service.seller,
            buyerId: req.user._id,
            isService: true
        });

        res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, 'Service Quotation Sent Successfully')
        );
    } catch (err) {
        handleError(res, err);
    }
};
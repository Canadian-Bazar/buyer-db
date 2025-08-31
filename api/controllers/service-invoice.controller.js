import ServiceInvoice from '../models/service-invoice.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import ServiceChat from '../models/service-chat.schema.js';
import ServiceMessages from '../models/service-messages.schema.js';
import ServiceOrders from '../models/service-orders.schema.js';
import ServiceQuotation from '../models/service-quotations.schema.js';
import mongoose from 'mongoose';
import storeMessageInRedis from '../helpers/storeMessageInRedis.js';

// Helper function to generate unique service order ID
const generateServiceOrderId = () => {
    return 'SRV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Helper function to create service order from invoice
const createServiceOrderFromInvoice = async (serviceInvoice, buyerId, serviceChatId, session) => {
    const orderData = {
        orderId: generateServiceOrderId(),
        serviceQuotationId: serviceInvoice.serviceQuotationId,
        serviceInvoiceId: serviceInvoice._id,
        serviceChatId: serviceChatId,
        finalPrice: serviceInvoice.totalAmount,
        status: 'pending',
        serviceType: 'general_service',
        deliveryMethod: 'digital'
    };

    const orderArray = await ServiceOrders.create([orderData], { session });
    return orderArray[0];
};

export const getServiceInvoiceDetails = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { serviceInvoiceToken } = validatedData;

        const decoded = jwt.verify(serviceInvoiceToken, process.env.SERVICE_INVOICE_SECRET);
        const serviceInvoiceId = decoded.serviceInvoiceId;

        const serviceInvoiceDetails = await ServiceInvoice.findById(serviceInvoiceId)
            .populate({
                path: 'serviceQuotationId',
                select: 'title description minPrice maxPrice deadline requirements'
            })
            .populate('sellerId', 'companyName email phone logo city state');

        if (!serviceInvoiceDetails) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service invoice not found');
        }

        if (serviceInvoiceDetails.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Service invoice has expired');
        }

        // Update viewing status if not already viewed
        if (!serviceInvoiceDetails.viewedByBuyer) {
            await ServiceInvoice.findByIdAndUpdate(serviceInvoiceId, {
                viewedByBuyer: true,
                viewedAt: new Date()
            });
            
            // Update the local object to reflect the change
            serviceInvoiceDetails.viewedByBuyer = true;
            serviceInvoiceDetails.viewedAt = new Date();
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, serviceInvoiceDetails)
        );

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid service invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Service invoice token has expired'));
        }
        handleError(res, err);
    }
};

export const acceptServiceInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    let isTransactionCommitted = false;
    
    try {
        session.startTransaction();
        
        const validatedData = matchedData(req);
        const { serviceInvoiceToken } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(serviceInvoiceToken, process.env.SERVICE_INVOICE_SECRET);
        const serviceInvoiceId = decoded.serviceInvoiceId;

        const serviceInvoice = await ServiceInvoice.findById(serviceInvoiceId)
            .session(session);

        if (!serviceInvoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service invoice not found');
        }

        if (serviceInvoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Service invoice has expired');
        }

        if (serviceInvoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Service invoice has already been ${serviceInvoice.status}`);
        }

        const serviceQuotationId = serviceInvoice.serviceQuotationId;

        const serviceChat = await ServiceChat.findOne({ quotation: serviceQuotationId })
            .session(session);

        if (!serviceChat) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service chat not found');
        }
            
        if (serviceChat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for service invoice acceptance');
        }

        await ServiceInvoice.findByIdAndUpdate(
            serviceInvoiceId, 
            {
                status: 'accepted',
                buyerId: buyerId,
                acceptedAt: new Date()
            }, 
            { session }
        );

        await ServiceQuotation.findByIdAndUpdate(
            serviceInvoice.serviceQuotationId, 
            { status: 'accepted' }, 
            { session }
        );

        const serviceOrder = await createServiceOrderFromInvoice(serviceInvoice, buyerId, serviceChat._id, session);

        await ServiceChat.findByIdAndUpdate(
            serviceChat._id, 
            {
                phase: 'invoice_accepted',
                'activeInvoice.status': 'accepted',
                'activeInvoice.respondedAt': new Date(),
                order: serviceOrder._id
            }, 
            { session }
        );

        await session.commitTransaction();
        isTransactionCommitted = true;

        const successMessage = {
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Service invoice accepted. Service order ${serviceOrder.orderId} created successfully.`,
            chat: serviceChat._id,
            quotationId: serviceInvoice.serviceQuotationId,
            messageType: 'service_invoice_accepted',
            isRead: false
        };
        
        await storeMessageInRedis(serviceChat._id, successMessage);

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Service invoice accepted successfully',
                orderId: serviceOrder.orderId
            })
        );

    } catch (err) {
        if (!isTransactionCommitted) {
            await session.abortTransaction();
        }
        
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid service invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Service invoice token has expired'));
        }
        handleError(res, err);
    } finally {
        session.endSession();
    }
};

export const rejectServiceInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    let isTransactionCommitted = false;
    
    try {
        session.startTransaction();
        
        const validatedData = matchedData(req);
        const { serviceInvoiceToken, rejectionReason } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(serviceInvoiceToken, process.env.SERVICE_INVOICE_SECRET);
        const serviceInvoiceId = decoded.serviceInvoiceId;

        const serviceInvoice = await ServiceInvoice.findById(serviceInvoiceId).session(session);

        if (!serviceInvoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service invoice not found');
        }

        if (serviceInvoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Service invoice has expired');
        }

        if (serviceInvoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Service invoice has already been ${serviceInvoice.status}`);
        }

        const serviceChat = await ServiceChat.findOne({ quotation: serviceInvoice.serviceQuotationId })
            .session(session);

        if (!serviceChat) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service chat not found');
        }
            
        if (serviceChat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for service invoice rejection');
        }

        await ServiceInvoice.findByIdAndUpdate(
            serviceInvoiceId, 
            {
                status: 'rejected',
                buyerId: buyerId,
                rejectedAt: new Date(),
                rejectionReason: rejectionReason || 'No reason provided'
            }, 
            { session }
        );

        await ServiceQuotation.findByIdAndUpdate(
            serviceInvoice.serviceQuotationId, 
            { status: 'negotiation' }, 
            { session }
        );

        await ServiceChat.findByIdAndUpdate(
            serviceChat._id, 
            {
                phase: 'negotiation',
                activeInvoice: null
            }, 
            { session }
        );

        await session.commitTransaction();
        isTransactionCommitted = true;

        const rejectionMessage = {
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Service invoice rejected. Reason: ${rejectionReason || 'No reason provided'}`,
            chat: serviceChat._id,
            quotationId: serviceInvoice.serviceQuotationId,
            messageType: 'service_invoice_rejected',
            isRead: false
        };
        
        await storeMessageInRedis(serviceChat._id, rejectionMessage);

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Service invoice rejected successfully. You can continue negotiating.'
            })
        );

    } catch (err) {
        if (!isTransactionCommitted) {
            await session.abortTransaction();
        }
        
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid service invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Service invoice token has expired'));
        }
        handleError(res, err);
    } finally {
        session.endSession();
    }
};
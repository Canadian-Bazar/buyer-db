import Invoice from '../models/invoice.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import Chat from '../models/chat.schema.js';
import Message from '../models/messages.schema.js';
import Orders from '../models/orders.schema.js';
import Quotation from '../models/quotations.schema.js';
import BuyerAddress from '../models/buyer-address.schema.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import storeMessageInRedis from '../helpers/storeMessageInRedis.js';

// Helper function to generate unique order ID
const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Helper function to create order from invoice
const createOrderFromInvoice = async (invoice, buyerId, chatId, session) => {
    // Fetch buyer's default addresses with session
    const [billingAddress, shippingAddress] = await Promise.all([
        BuyerAddress.findOne({ 
            buyerId: buyerId, 
            addressType: 'Billing', 
            isDefault: true 
        }).session(session),
        BuyerAddress.findOne({ 
            buyerId: buyerId, 
            addressType: 'Shipping', 
            isDefault: true 
        }).session(session)
    ]);

    if (!billingAddress) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Buyer must have a default billing address');
    }

    if (!shippingAddress) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Buyer must have a default shipping address');
    }

    const orderData = {
        orderId: generateOrderId(),
        quotationId: invoice.quotationId,
        invoiceId: invoice._id,
        chatId: chatId,
        finalPrice: invoice.negotiatedPrice,
        shippingAddress: shippingAddress._id,
        billingAddress: billingAddress._id,
        paymentMethod: 'pending',
        paymentStatus: 'pending',
        status: 'pending'
    };

    const orderArray = await Orders.create([orderData], { session });
    return orderArray[0];
};

export const getInvoiceDetails = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { invoiceToken } = validatedData;

        let decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        const invoiceId = decoded.invoiceId;

        const invoiceDetails = await Invoice.findById(invoiceId)
            .populate({
                path: 'quotationId',
                populate: {
                    path: 'productId',
                    select: 'name images category description'
                }
            })
            .populate('sellerId', 'companyName email profileImage phone city state')

        if (!invoiceDetails) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoiceDetails.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        // Update viewing status if not already viewed
        if (!invoiceDetails.viewedByBuyer) {
            await Invoice.findByIdAndUpdate(invoiceId, {
                viewedByBuyer: true,
                viewedAt: new Date()
            });
            
            // Update the local object to reflect the change
            invoiceDetails.viewedByBuyer = true;
            invoiceDetails.viewedAt = new Date();
        }

        // Structure the response to match frontend expectations
        const response = {
            data: {
                response: invoiceDetails
            }
        };

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, invoiceDetails)
        );

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invoice token has expired'));
        }
        handleError(res, err);
    }
};

export const acceptInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    let isTransactionCommitted = false;
    
    try {
        session.startTransaction();
        
        const validatedData = matchedData(req);
        const { invoiceToken } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        console.log(decoded);
        const invoiceId = decoded.invoiceId;

        const invoice = await Invoice.findById(invoiceId)
            .session(session);

        if (!invoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        if (invoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Invoice has already been ${invoice.status}`);
        }
        
        console.log(invoice);

        const quotationId = invoice.quotationId;

        const chat = await Chat.findOne({ quotation: quotationId })
            .session(session);

        console.log(chat);
            
        if (chat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for invoice acceptance');
        }

        await Invoice.findByIdAndUpdate(
            invoiceId, 
            {
                status: 'accepted',
                buyerId: buyerId,
                acceptedAt: new Date()
            }, 
            { session }
        );

        await Quotation.findByIdAndUpdate(
            invoice.quotationId, 
            { status: 'accepted' }, 
            { session }
        );

        const order = await createOrderFromInvoice(invoice, buyerId, chat._id, session);

        await Chat.findByIdAndUpdate(
            chat._id, 
            {
                phase: 'order_created',
                'activeInvoice.status': 'accepted',
                'activeInvoice.respondedAt': new Date(),
                order: order._id
            }, 
            { session }
        );

        await session.commitTransaction();
        isTransactionCommitted = true;

        const successMessage = {
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Invoice accepted. Order ${order.orderId} created successfully.`,
            chat: chat._id,
            quotationId: invoice.quotationId,
            messageType: 'text',
            isRead: false
        };
        
        await storeMessageInRedis(chat._id, successMessage);

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Invoice accepted successfully',
                orderId: order.orderId
            })
        );

    } catch (err) {
        if (!isTransactionCommitted) {
            await session.abortTransaction();
        }
        
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invoice token has expired'));
        }
        handleError(res, err);
    } finally {
        session.endSession();
    }
};

export const rejectInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    let isTransactionCommitted = false;
    
    try {
        session.startTransaction();
        
        const validatedData = matchedData(req);
        const { invoiceToken, rejectionReason } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        const invoiceId = decoded.invoiceId;

        const invoice = await Invoice.findById(invoiceId).session(session);

        if (!invoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        if (invoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Invoice has already been ${invoice.status}`);
        }

        const chat = await Chat.findOne({ quotation: invoice.quotationId })
            .session(session);
            
        if (chat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for invoice rejection');
        }

        await Invoice.findByIdAndUpdate(
            invoiceId, 
            {
                status: 'rejected',
                buyerId: buyerId,
                rejectedAt: new Date(),
                rejectionReason: rejectionReason || 'No reason provided'
            }, 
            { session }
        );

        await Quotation.findByIdAndUpdate(
            invoice.quotationId, 
            { status: 'negotiation' }, 
            { session }
        );

        await Chat.findByIdAndUpdate(
            chat._id, 
            {
                phase: 'negotiation',
                activeInvoice:null
            }, 

            
            { session }
        );

        await session.commitTransaction();
        isTransactionCommitted = true;

        const rejectionMessage = {
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Invoice rejected. Reason: ${rejectionReason || 'No reason provided'}`,
            chat: chat._id,
            quotationId: invoice.quotationId,
            messageType: 'text',
            isRead: false
        };
        
        await storeMessageInRedis(chat._id, rejectionMessage);

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Invoice rejected successfully. You can continue negotiating.'
            })
        );

    } catch (err) {
        if (!isTransactionCommitted) {
            await session.abortTransaction();
        }
        
        if (err.name === 'JsonWebTokenError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid invoice token'));
        }
        if (err.name === 'TokenExpiredError') {
            return handleError(res, buildErrorObject(httpStatus.UNAUTHORIZED, 'Invoice token has expired'));
        }
        handleError(res, err);
    } finally {
        session.endSession();
    }
};
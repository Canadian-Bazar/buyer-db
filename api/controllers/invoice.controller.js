
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
import { v4 as uuidv4 } from 'uuid';

// Helper function to generate unique order ID
const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Helper function to create order from invoice
const createOrderFromInvoice = async (invoice, buyerId , chatId) => {
    // Fetch buyer's default addresses
    const [billingAddress, shippingAddress] = await Promise.all([
        BuyerAddress.findOne({ 
            buyerId: buyerId, 
            addressType: 'Billing', 
            isDefault: true 
        }),
        BuyerAddress.findOne({ 
            buyerId: buyerId, 
            addressType: 'Shipping', 
            isDefault: true 
        })
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
        paymentMethod: 'pending', // Will be updated when payment is processed
        paymentStatus: 'pending',
        status: 'pending'
    };

    const order = await Orders.create(orderData);
    return order;
};

export const getInvoiceDetails = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { invoiceToken } = validatedData;

        let  decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        const invoiceId = decoded.invoiceId;

        const invoiceDetails = await Invoice.findById(invoiceId)
            .populate('quotationId')
            .populate('sellerId', 'companyName email profileImage')
            .populate('chatId');

        if (!invoiceDetails) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoiceDetails.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        // Mark as viewed by buyer
        if (!invoiceDetails.viewedByBuyer) {
            await Invoice.findByIdAndUpdate(invoiceId, {
                viewedByBuyer: true,
                viewedAt: new Date()
            });
        }

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
    try {
        const validatedData = matchedData(req);
        const { invoiceToken } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);

        console.log(decoded)
        const invoiceId = decoded.invoiceId;

        const invoice = await Invoice.findById(invoiceId).populate('quotationId');

        if (!invoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        if (invoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Invoice has already been ${invoice.status}`);
        }
        console.log(invoice)

        // Check if chat is in correct phase
        const chat = await Chat.findOne({quotationId:validatedData.quotationId});
        if (chat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for invoice acceptance');
        }

        // Update invoice status
        await Invoice.findByIdAndUpdate(invoiceId, {
            status: 'accepted',
            buyerId: buyerId,
            acceptedAt: new Date()
        });

        // Update quotation status to accepted
        await Quotation.findByIdAndUpdate(invoice.quotationId, {
            status: 'accepted'
        });

        // Create order automatically
        const order = await createOrderFromInvoice(invoice, buyerId , chat._id);

        // Update chat phase and add order reference
        await Chat.findByIdAndUpdate(chat._id, {
            phase: 'order_created',
            'activeInvoice.status': 'accepted',
            'activeInvoice.respondedAt': new Date(),
            order: order._id
        });

        // Create system message for invoice acceptance
        await Message.create({
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Invoice accepted. Order ${order.orderId} created.`,
            chat: chat._id,
            quotationId: invoice.quotationId,
            messageType: 'text',
            isRead: false
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Invoice accepted successfully',
                orderId: order.orderId,
                orderDetails: order
            })
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

export const rejectInvoice = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { invoiceToken, rejectionReason } = validatedData;
        const buyerId = req.user._id;

        const decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        const invoiceId = decoded.invoiceId;

        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoice.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        if (invoice.status !== 'pending') {
            throw buildErrorObject(httpStatus.CONFLICT, `Invoice has already been ${invoice.status}`);
        }

        // Check if chat is in correct phase
       const chat = await Chat.findOne({quotationId:validatedData.quotationId});
        if (chat.phase !== 'invoice_sent') {
            throw buildErrorObject(httpStatus.CONFLICT, 'Invalid chat phase for invoice acceptance');
        }

        // Update invoice status
        await Invoice.findByIdAndUpdate(invoiceId, {
            status: 'rejected',
            buyerId: buyerId,
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || 'No reason provided'
        });

        // Update quotation status back to negotiation
        await Quotation.findByIdAndUpdate(invoice.quotationId, {
            status: 'negotiation'
        });

        // Update chat phase back to negotiation
        await Chat.findByIdAndUpdate(chat._id, {
            phase: 'negotiation',
            'activeInvoice.status': 'rejected',
            'activeInvoice.respondedAt': new Date()
        });

        // Create system message for invoice rejection
        await Message.create({
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Invoice rejected. Reason: ${rejectionReason || 'No reason provided'}`,
            chat: chat._id,
            quotationId: invoice.quotationId,
            messageType: 'text',
            isRead: false
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Invoice rejected successfully. You can continue negotiating.'
            })
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
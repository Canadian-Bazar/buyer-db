import Invoice from '../models/invoice.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';

export const getInvoiceDetails = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { invoiceToken } = validatedData;

        const decoded = jwt.verify(invoiceToken, process.env.INVOICE_SECRET);
        const invoiceId = decoded.invoiceId;

        const invoiceDetails = await Invoice.findById(invoiceId)
            .populate('quotationId')
            .populate('sellerId', 'name email');

        if (!invoiceDetails) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Invoice not found');
        }

        if (invoiceDetails.expiresAt < new Date()) {
            throw buildErrorObject(httpStatus.GONE, 'Invoice has expired');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, 
              invoiceDetails
            )
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

        const invoiceData = {
            ...invoice.toObject(),
            status: 'accepted',
            buyerId: buyerId,
            acceptedAt: new Date()
        };

        await Invoice.findByIdAndUpdate(invoiceId, {
            status: 'accepted',
            buyerId: buyerId,
            acceptedAt: invoiceData.acceptedAt
        }, { new: true });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
            message: 'Invoice accepted successfully',
            invoiceData
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

        const invoiceData = {
            ...invoice.toObject(),
            status: 'rejected',
            buyerId: buyerId,
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || 'No reason provided'
        };

        await Invoice.findByIdAndUpdate(invoiceId, {
            status: 'rejected',
            buyerId: buyerId,
            rejectedAt: invoiceData.rejectedAt,
            rejectionReason: invoiceData.rejectionReason
        }, { new: true });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Invoice rejected successfully',
                invoiceData
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
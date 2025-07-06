import Orders from '../models/orders.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import Chat from '../models/chat.schema.js';
import Message from '../models/messages.schema.js';
import mongoose from 'mongoose';

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role; // 'buyer' or 'seller'

        const order = await Orders.findOne({ orderId })
            .populate({
                path: 'quotationId',
                populate: {
                    path: 'buyer seller',
                    select: 'fullName companyName email profilePic profileImage'
                }
            })
            .populate('invoiceId')
            .populate('chatId');

        if (!order) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Check if user has access to this order
        const quotation = order.quotationId;
        const hasAccess = (userRole === 'buyer' && quotation.buyer._id.toString() === userId.toString()) ||
                         (userRole === 'seller' && quotation.seller._id.toString() === userId.toString());

        if (!hasAccess) {
            throw buildErrorObject(httpStatus.FORBIDDEN, 'You do not have access to this order');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, order)
        );

    } catch (err) {
        handleError(res, err);
    }
};

// Update order status (seller only)


// Get all orders for buyer
export const getBuyerOrders = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { page = 1, limit = 10, status } = validatedData;
        const buyerId = req.user._id;

        const effectiveLimit = Math.min(limit, 50);
        const skip = (page - 1) * effectiveLimit;

        // Build aggregation pipeline
        const pipeline = [
            {
                $lookup: {
                    from: 'Quotation',
                    localField: 'quotationId',
                    foreignField: '_id',
                    as: 'quotation'
                }
            },
            {
                $unwind: '$quotation'
            },
            {
                $match: {
                    'quotation.buyer': new mongoose.Types.ObjectId(buyerId)
                }
            }
        ];

        if (status) {
            pipeline.push({ $match: { status } });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'Seller',
                    localField: 'quotation.seller',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            {
                $unwind: '$seller'
            },
            {
                $lookup: {
                    from: 'Product',
                    localField: 'quotation.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            },
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    finalPrice: 1,
                    paymentStatus: 1,
                    trackingNumber: 1,
                    estimatedDeliveryDate: 1,
                    deliveredAt: 1,
                    createdAt: 1,
                    'seller.companyName': 1,
                    'seller.profileImage': 1,
                    'product.name': 1,
                    'product.images': 1,
                    'quotation.quantity': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: effectiveLimit }
        );

        const orders = await Orders.aggregate(pipeline);

        // Get total count
        const countPipeline = [
            {
                $lookup: {
                    from: 'Quotations',
                    localField: 'quotationId',
                    foreignField: '_id',
                    as: 'quotation'
                }
            },
            {
                $unwind: '$quotation'
            },
            {
                $match: {
                    'quotation.buyer': new mongoose.Types.ObjectId(buyerId)
                }
            }
        ];

        if (status) {
            countPipeline.push({ $match: { status } });
        }

        countPipeline.push({ $count: 'total' });

        const [countResult] = await Orders.aggregate(countPipeline);
        const total = countResult?.total || 0;

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: effectiveLimit,
                    total,
                    pages: Math.ceil(total / effectiveLimit),
                    hasNext: skip + effectiveLimit < total,
                    hasPrev: page > 1
                }
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};


export const cancelOrder = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { orderId, cancellationReason } = validatedData;
        const buyerId = req.user._id;

        const order = await Orders.findOne({ orderId })
            .populate('quotationId');

        if (!order) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Check if buyer owns this order
        if (order.quotationId.buyer.toString() !== buyerId.toString()) {
            throw buildErrorObject(httpStatus.FORBIDDEN, 'You do not have access to this order');
        }

        const cancellableStatuses = ['pending', 'confirmed', 'processing', 'ready_to_ship'];
        if (!cancellableStatuses.includes(order.status)) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Order cannot be cancelled at this stage');
        }

        await Orders.findOneAndUpdate(
            { orderId },
            {
                status: 'cancelled',
                cancellationReason: cancellationReason || 'Cancelled by buyer'
            }
        );

        await Message.create({
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Order cancelled. Reason: ${cancellationReason || 'Cancelled by buyer'}`,
            chat: order.chatId,
            quotationId: order.quotationId._id,
            messageType: 'text',
            isRead: false
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Order cancelled successfully'
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};
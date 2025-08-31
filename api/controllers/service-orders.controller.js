import ServiceOrders from '../models/service-orders.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import ServiceChat from '../models/service-chat.schema.js';
import ServiceMessages from '../models/service-messages.schema.js';
import mongoose from 'mongoose';

export const getServiceOrders = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { page = 1, limit = 10, status, search } = validatedData;
        const buyerId = req.user._id;

        const effectiveLimit = Math.min(limit, 50);
        const skip = (page - 1) * effectiveLimit;

        const pipeline = [
            {
                $lookup: {
                    from: 'ServiceQuotation',
                    localField: 'serviceQuotationId',
                    foreignField: '_id',
                    as: 'serviceQuotation'
                }
            },
            {
                $unwind: '$serviceQuotation'
            },
            {
                $match: {
                    'serviceQuotation.buyerId': new mongoose.Types.ObjectId(buyerId)
                }
            }
        ];

        if (status) {
            pipeline.push({ $match: { status } });
        }

        pipeline.push(
            {
                $lookup: {
                    from: 'Sellers',
                    localField: 'serviceQuotation.sellerId',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            {
                $unwind: '$seller'
            }
        );

        // Add search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { orderId: { $regex: search, $options: 'i' } },
                        { 'serviceQuotation.title': { $regex: search, $options: 'i' } },
                        { 'seller.companyName': { $regex: search, $options: 'i' } },
                        { 'seller.fullName': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        pipeline.push(
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    finalPrice: 1,
                    serviceType: 1,
                    deliveryMethod: 1,
                    expectedDeliveryDate: 1,
                    actualDeliveryDate: 1,
                    deliveredAt: 1,
                    createdAt: 1,
                    'seller.fullName': 1,
                    'seller.companyName': 1,
                    'seller.logo': 1,
                    'serviceQuotation.title': 1,
                    'serviceQuotation.description': 1,
                    'serviceQuotation.minPrice': 1,
                    'serviceQuotation.maxPrice': 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: effectiveLimit }
        );

        const orders = await ServiceOrders.aggregate(pipeline);

        // Count pipeline for pagination
        const countPipeline = [
            {
                $lookup: {
                    from: 'ServiceQuotation',
                    localField: 'serviceQuotationId',
                    foreignField: '_id',
                    as: 'serviceQuotation'
                }
            },
            {
                $unwind: '$serviceQuotation'
            },
            {
                $match: {
                    'serviceQuotation.buyerId': new mongoose.Types.ObjectId(buyerId)
                }
            }
        ];

        if (status) {
            countPipeline.push({ $match: { status } });
        }

        // Add the same lookups for search functionality in count pipeline
        if (search) {
            countPipeline.push(
                {
                    $lookup: {
                        from: 'Seller',
                        localField: 'serviceQuotation.sellerId',
                        foreignField: '_id',
                        as: 'seller'
                    }
                },
                {
                    $unwind: '$seller'
                },
                {
                    $match: {
                        $or: [
                            { orderId: { $regex: search, $options: 'i' } },
                            { 'serviceQuotation.title': { $regex: search, $options: 'i' } },
                            { 'seller.companyName': { $regex: search, $options: 'i' } },
                            { 'seller.fullName': { $regex: search, $options: 'i' } }
                        ]
                    }
                }
            );
        }

        countPipeline.push({ $count: 'total' });

        const [countResult] = await ServiceOrders.aggregate(countPipeline);
        const total = countResult?.total || 0;

        const response = {
            docs: orders,
            page: parseInt(page),
            limit: effectiveLimit,
            total,
            pages: Math.ceil(total / effectiveLimit),
            hasNext: skip + effectiveLimit < total,
            hasPrev: page > 1
        };

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, response)
        );

    } catch (err) {
        handleError(res, err);
    }
};

export const getServiceOrderById = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { orderId } = validatedData;
        const buyerId = req.user._id;

        const pipeline = [
            {
                $match: { orderId: orderId }
            },
            {
                $lookup: {
                    from: 'ServiceQuotation',
                    localField: 'serviceQuotationId',
                    foreignField: '_id',
                    as: 'serviceQuotation'
                }
            },
            {
                $unwind: '$serviceQuotation'
            },
            {
                $match: {
                    'serviceQuotation.buyerId': new mongoose.Types.ObjectId(buyerId)
                }
            },
            {
                $lookup: {
                    from: 'Sellers',
                    localField: 'serviceQuotation.sellerId',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            {
                $unwind: '$seller'
            },
            {
                $lookup: {
                    from: 'ServiceChat',
                    localField: 'serviceChatId',
                    foreignField: '_id',
                    as: 'serviceChat'
                }
            },
            {
                $unwind: '$serviceChat'
            },
            {
                $lookup: {
                    from: 'ServiceInvoice',
                    localField: 'serviceInvoiceId',
                    foreignField: '_id',
                    as: 'serviceInvoice'
                }
            },
            {
                $unwind: '$serviceInvoice'
            },
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    finalPrice: 1,
                    serviceType: 1,
                    deliveryMethod: 1,
                    expectedDeliveryDate: 1,
                    actualDeliveryDate: 1,
                    deliveredAt: 1,
                    milestones: 1,
                    deliverables: 1,
                    feedback: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    
                    // SELLER DATA
                    seller: {
                        _id: '$seller._id',
                        fullName: '$seller.fullName',
                        email: '$seller.email',
                        phone: '$seller.phone',
                        logo: '$seller.logo',
                        companyName: '$seller.companyName',
                        businessAddress: '$seller.businessAddress'
                    },
                    
                    serviceQuotation: {
                        _id: '$serviceQuotation._id',
                        title: '$serviceQuotation.title',
                        description: '$serviceQuotation.description',
                        minPrice: '$serviceQuotation.minPrice',
                        maxPrice: '$serviceQuotation.maxPrice',
                        deadline: '$serviceQuotation.deadline',
                        requirements: '$serviceQuotation.requirements',
                        createdAt: '$serviceQuotation.createdAt'
                    },
                    
                    shippingAddress: 1,
                    billingAddress: 1,
                    
                    serviceInvoice: {
                        _id: '$serviceInvoice._id',
                        totalAmount: '$serviceInvoice.totalAmount',
                        taxAmount: '$serviceInvoice.taxAmount',
                        paymentTerms: '$serviceInvoice.paymentTerms',
                        deliveryTerms: '$serviceInvoice.deliveryTerms',
                        createdAt: '$serviceInvoice.createdAt'
                    },
                    
                    serviceChat: {
                        _id: '$serviceChat._id',
                        phase: '$serviceChat.phase',
                        status: '$serviceChat.status'
                    }
                }
            }
        ];

        const [order] = await ServiceOrders.aggregate(pipeline);

        if (!order) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service order not found');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, order)
        );

    } catch (err) {
        handleError(res, err);
    }
};

export const addServiceOrderFeedback = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { orderId, rating, comment } = validatedData;
        const buyerId = req.user._id;

        const order = await ServiceOrders.findOne({ orderId })
            .populate('serviceQuotationId');

        if (!order) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service order not found');
        }

        if (order.serviceQuotationId.buyerId.toString() !== buyerId.toString()) {
            throw buildErrorObject(httpStatus.FORBIDDEN, 'You do not have access to this service order');
        }

        if (order.status !== 'delivered' && order.status !== 'completed') {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Can only provide feedback for completed/delivered orders');
        }

        if (order.feedback && order.feedback.rating) {
            throw buildErrorObject(httpStatus.CONFLICT, 'Feedback has already been provided for this order');
        }

        const feedback = {
            rating,
            comment: comment || '',
            submittedAt: new Date()
        };

        const updatedOrder = await ServiceOrders.findOneAndUpdate(
            { orderId },
            { feedback },
            { new: true }
        );

        // Create service message about feedback
        await ServiceMessages.create({
            senderId: buyerId,
            senderModel: 'Buyer',
            content: `Feedback submitted: ${rating}/5 stars${comment ? ` - ${comment}` : ''}`,
            chat: order.serviceChatId,
            quotationId: order.serviceQuotationId._id,
            messageType: 'text',
            isRead: false
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Feedback submitted successfully',
                order: updatedOrder
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};
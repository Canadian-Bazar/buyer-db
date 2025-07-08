import Orders from '../models/orders.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import Chat from '../models/chat.schema.js';
import Message from '../models/messages.schema.js';
import mongoose from 'mongoose';

export const getOrders = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { page = 1, limit = 10, status, search } = validatedData;
        const buyerId = req.user._id;

        const effectiveLimit = Math.min(limit, 50);
        const skip = (page - 1) * effectiveLimit;

        console.log('sdhbdhsc')

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
                    from: 'Sellers',
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
            }
        );

        // Add search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { orderId: { $regex: search, $options: 'i' } },
                        { 'product.name': { $regex: search, $options: 'i' } },
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
                    paymentStatus: 1,
                    trackingNumber: 1,
                    estimatedDeliveryDate: 1,
                    deliveredAt: 1,
                    createdAt: 1,
                    'seller.fullName': 1,
                    'seller.companyName': 1,
                    'seller.logo': 1,
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

        console.log(orders
            
        )

        console.log(req.user)

        // Count pipeline for pagination
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

        // Add the same lookups for search functionality in count pipeline
        if (search) {
            countPipeline.push(
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
                    $match: {
                        $or: [
                            { orderId: { $regex: search, $options: 'i' } },
                            { 'product.name': { $regex: search, $options: 'i' } },
                            { 'seller.companyName': { $regex: search, $options: 'i' } },
                            { 'seller.fullName': { $regex: search, $options: 'i' } }
                        ]
                    }
                }
            );
        }

        countPipeline.push({ $count: 'total' });

        const [countResult] = await Orders.aggregate(countPipeline);
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

export const getOrderById = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { orderId } = validatedData;
        const buyerId = req.user._id;

        console.log(orderId)

        const pipeline = [
            {
                $match: { orderId: orderId }
            },
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
            },
            {
                $lookup: {
                    from: 'Sellers',
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
                    from: 'BuyerAddresses',
                    localField: 'shippingAddress',
                    foreignField: '_id',
                    as: 'shippingAddress'
                }
            },
            {
                $unwind: '$shippingAddress'
            },
            {
                $lookup: {
                    from: 'BuyerAddresses',
                    localField: 'billingAddress',
                    foreignField: '_id',
                    as: 'billingAddress'
                }
            },
            {
                $unwind: '$billingAddress'
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
                $lookup: {
                    from: 'Chat',
                    localField: 'chatId',
                    foreignField: '_id',
                    as: 'chat'
                }
            },
            {
                $unwind: '$chat'
            },
            {
                $lookup: {
                    from: 'Invoice',
                    localField: 'invoiceId',
                    foreignField: '_id',
                    as: 'invoice'
                }
            },
            {
                $unwind: '$invoice'
            },
            {
                $project: {
                    orderId: 1,
                    status: 1,
                    finalPrice: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    trackingNumber: 1,
                    estimatedDeliveryDate: 1,
                    deliveredAt: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    
                    // COMPLETE SELLER DATA
                    seller: {
                        _id: '$seller._id',
                        fullName: '$seller.fullName',
                        email: '$seller.email',
                        phone: '$seller.phone',
                        logo: '$seller.logo',
                        companyName: '$seller.companyName',
                        businessAddress: '$seller.businessAddress'
                    },
                    
                    product: {
                        _id: '$product._id',
                        name: '$product.name',
                        description: '$product.description',
                        images: '$product.images',
                        category: '$product.category',
                        specifications: '$product.specifications'
                    },
                    
                    quotation: {
                        _id: '$quotation._id',
                        quantity: '$quotation.quantity',
                        quotedPrice: '$quotation.quotedPrice',
                        validUntil: '$quotation.validUntil',
                        requirements: '$quotation.requirements',
                        createdAt: '$quotation.createdAt'
                    },
                    
                    shippingAddress: {
                        fullName: '$shippingAddress.fullName',
                        addressLine1: '$shippingAddress.addressLine1',
                        addressLine2: '$shippingAddress.addressLine2',
                        city: '$shippingAddress.city',
                        state: '$shippingAddress.state',
                        pincode: '$shippingAddress.pincode',
                        country: '$shippingAddress.country',
                        phone: '$shippingAddress.phone'
                    },
                    
                    billingAddress: {
                        fullName: '$billingAddress.fullName',
                        addressLine1: '$billingAddress.addressLine1',
                        addressLine2: '$billingAddress.addressLine2',
                        city: '$billingAddress.city',
                        state: '$billingAddress.state',
                        pincode: '$billingAddress.pincode',
                        country: '$billingAddress.country',
                        phone: '$billingAddress.phone'
                    },
                    
                    invoice: {
                        _id: '$invoice._id',
                        negotiatedPrice: '$invoice.negotiatedPrice',
                        taxAmount: '$invoice.taxAmount',
                        shippingCharges: '$invoice.shippingCharges',
                        paymentTerms: '$invoice.paymentTerms',
                        deliveryTerms: '$invoice.deliveryTerms',
                        createdAt: '$invoice.createdAt'
                    },
                    
                    // CHAT DATA
                    chat: {
                        _id: '$chat._id',
                        phase: '$chat.phase',
                        status: '$chat.status'
                    },
                    
                }
            }
        ];

        const order = await Orders.aggregate(pipeline);

        console.log(order)

        if (!order || order.length === 0) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Order not found');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, order[0])
        );

    } catch (err) {
        handleError(res, err);
    }
};
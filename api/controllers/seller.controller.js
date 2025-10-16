import handleError from '../utils/handleError.js'
import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import buildResponse from '../utils/buildResponse.js'
import Seller from '../models/seller.schema.js'
import Product from '../models/products.schema.js'
import Service from '../models/service.schema.js'
import mongoose from 'mongoose'

export const getSellerProfileController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { sellerId } = validatedData

        const seller = await Seller.findById(sellerId)
            // Exclude only sensitive/internal fields; return contact/registration & timestamps for profile modal
            .select('-password -stripeCustomerId -__v')
            .populate('categories businessType')
            .lean()

        if (!seller) {
            return res.status(httpStatus.NOT_FOUND).json(
                buildResponse(httpStatus.NOT_FOUND, 'Seller not found')
            )
        }

        // Check if seller is blocked or not verified
        if (seller.isBlocked || !seller.isVerified) {
            return res.status(httpStatus.NOT_FOUND).json(
                buildResponse(httpStatus.NOT_FOUND, 'Seller not found')
            )
        }

        // Fetch products
        const products = await Product.find({ 
            seller: sellerId,
            isComplete: true,
            isBlocked: false,
            isArchived: false
        })
        .select('name slug avgRating ratingsCount isVerified images videos about services minPrice unitPrice maxPrice moq categoryId deliveryDays isCustomizable')
        .populate('categoryId', 'name')
        .limit(10)
        .lean()

        // Fetch services
        const services = await Service.find({ 
            seller: sellerId,
            isComplete: true,
            isBlocked: false,
            isArchived: false
        })
        .select('name slug description avgRating ratingsCount category createdAt')
        .populate('category', 'name')
        .limit(10)
        .lean()

        const sellerProfile = {
            ...seller,
            products,
            services
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, sellerProfile)
        )
    } catch (err) {
        handleError(res, err)
    }
}

export const listSellersController = async (req, res) => {
    try {
        const v = matchedData(req)
        const page = Math.max(parseInt(v.page) || 1, 1)
        const limit = Math.min(parseInt(v.limit) || 12, 50)
        const skip = (page - 1) * limit

        const match = {
            isBlocked: { $ne: true }, // Exclude blocked sellers
            isVerified: true // Only show verified sellers
        }

        if (v.search) {
            match.companyName = { $regex: v.search, $options: 'i' }
        }
        if (v.province) {
            match.state = { $regex: v.province, $options: 'i' }
        }
        if (v.city) {
            match.city = { $regex: v.city, $options: 'i' }
        }
        if (v.verified !== undefined) {
            match.isVerified = !!v.verified
        }
        if (v.category) {
            const catId = mongoose.Types.ObjectId.isValid(v.category)
                ? new mongoose.Types.ObjectId(v.category)
                : null
            if (catId) match.categories = catId
        }

        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: 'Category',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categoryDocs'
                }
            },
            {
                $project: {
                    companyName: 1,
                    email: 1,
                    phone: 1,
                    city: 1,
                    state: 1,
                    zip: 1,
                    street: 1,
                    isVerified: 1,
                    logo: 1,
                    categories: '$categoryDocs._id'
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]

        const [docs, countArr] = await Promise.all([
            Seller.aggregate(pipeline),
            Seller.aggregate([{ $match: match }, { $count: 'count' }])
        ])

        const total = countArr?.[0]?.count || 0

        return res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                docs,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasPrev: page > 1,
                hasNext: page * limit < total
            })
        )
    } catch (err) {
        handleError(res, err)
    }
}
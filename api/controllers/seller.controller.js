import handleError from '../utils/handleError.js'
import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import buildResponse from '../utils/buildResponse.js'
import Seller from '../models/seller.schema.js'
import Product from '../models/products.schema.js'

export const getSellerProfileController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { sellerId } = validatedData

        const seller = await Seller.findById(sellerId)
            .select('-password -phone -email -businessNumber -stripeCustomerId -createdAt -updatedAt -__v')
            .populate('categories businessType')
            .lean()

        if (!seller) {
            return res.status(httpStatus.NOT_FOUND).json(
                buildResponse(httpStatus.NOT_FOUND, 'Seller not found')
            )
        }

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

        const sellerProfile = {
            ...seller,
            products
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, sellerProfile)
        )
    } catch (err) {
        handleError(res, err)
    }
}
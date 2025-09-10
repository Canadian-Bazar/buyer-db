import Review from '../models/review.schema.js'
import Product from '../models/products.schema.js'
import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import httpStatus from "http-status"; 
import mongoose from "mongoose";
import { matchedData } from "express-validator";
import { validate } from 'node-cron';





/**
 * Updates product's avgRating and ratingsCount based on current reviews
 * @param {ObjectId} productId - The product ID to update ratings for
 * @param {ClientSession} session - Optional MongoDB session for transactions
 */
const updateProductRatings = async (productId, session = null) => {
    const aggregationPipeline = [
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { 
            $group: { 
                _id: null, 
                avgRating: { $avg: '$rating' },
                ratingsCount: { $sum: 1 }
            }
        }
    ];

    const aggregationResult = await Review.aggregate(aggregationPipeline);
    const ratings = aggregationResult[0] || { avgRating: 0, ratingsCount: 0 };

    // Round avgRating to 1 decimal place
    const roundedAvgRating = Math.round(ratings.avgRating * 10) / 10;

    const updateOptions = session ? { session } : {};
    
    await Product.findByIdAndUpdate(
        productId,
        {
            avgRating: roundedAvgRating,
            ratingsCount: ratings.ratingsCount
        },
        updateOptions
    );

    return {
        avgRating: roundedAvgRating,
        ratingsCount: ratings.ratingsCount
    };
};

export const getReviews = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { productId } = validatedData;

        const query = {
            product: new mongoose.Types.ObjectId(productId)
        };

        if (validatedData.rating) {
            query.rating = validatedData.rating;
        }

        if (validatedData.search) {
            query.$or = [
                { 'buyer.name': { $regex: validatedData.search, $options: 'i' } },
                { 'buyer.email': { $regex: validatedData.search, $options: 'i' } }
            ];
        }

        const page = validatedData.page || 1;
        const limit = Math.min(validatedData.limit || 20, 20);
        const skip = (page - 1) * limit;

        let sort = {};
        if (validatedData.sortByRating === 'asc' || validatedData.sortByRating === 'desc') {
                sort.rating = validatedData.sortByRating === 'asc' ? 1 : -1;
                }

             const oldestFirst = validatedData.oldestFirst === 'true';

                if (oldestFirst) {
                    sort.createdAt = 1;
                } else {
                    sort.createdAt = -1;
                }



        const docs = await Review.find(query)
            .populate('buyer', 'fullName email profilePic avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalDocs = await Review.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        const response = {
            docs,
            hasNext,
            hasPrev,
            totalPages,
            currentPage: page,
            totalDocs,
            limit
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};



export const createOrUpdateReview = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const buyerId = req.user._id;
            
            const { productId, rating, comment } = validatedData;

            const existingReview = await Review.findOne({
                product: new mongoose.Types.ObjectId(productId),
                buyer: new mongoose.Types.ObjectId(buyerId)
            }).session(session);

            let review;
            let statusCode;
            let message;

            if (existingReview) {
                review = await Review.findByIdAndUpdate(
                    existingReview._id,
                    {
                        rating,
                        updatedAt: new Date(),
                        comment
                    },
                    { new: true, runValidators: true, session }
                ).populate('buyer', 'fullName email profilePic avatar');

                statusCode = httpStatus.OK;
                message = 'Review updated successfully';
            } else {
                const reviewData = {
                    product: new mongoose.Types.ObjectId(productId),
                    buyer: new mongoose.Types.ObjectId(buyerId),
                    rating,
                    comment
                };

                review = await Review.create([reviewData], { session });
                
                review = await Review.findById(review[0]._id)
                    .populate('buyer', 'fullName email profilePic avatar')
                    .session(session);

                statusCode = httpStatus.CREATED;
                message = 'Review created successfully';
            }

            // Update product ratings
            const updatedRatings = await updateProductRatings(productId, session);
            
            // Store response data for use after transaction
            req.responseData = {
                statusCode,
                message,
                review,
                updatedRatings
            };
        });

        // Send response after transaction completes
        const { statusCode, message, review, updatedRatings } = req.responseData;
        
        res.status(statusCode).json(
            buildResponse(statusCode, {
                message,
                review,
                productRatings: updatedRatings
            })
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

export const deleteReview = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const buyerId = req.user._id;
            const { reviewId } = validatedData;

            const review = await Review.findOneAndDelete({
                _id: new mongoose.Types.ObjectId(reviewId),
                buyer: new mongoose.Types.ObjectId(buyerId)
            }, { session });

            if (!review) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Review not found or unauthorized');
            }

            // Update product ratings after deletion
            const updatedRatings = await updateProductRatings(review.product, session);
            
            // Store response data for use after transaction
            req.responseData = {
                message: 'Review deleted successfully',
                updatedRatings
            };
        });

        // Send response after transaction completes
        const { message, updatedRatings } = req.responseData;
        
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message,
                productRatings: updatedRatings
            })
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Utility function to recalculate ratings for a specific product or all products
 * This can be used for data migration or fixing inconsistencies
 * @param {req} req - Express request object
 * @param {res} res - Express response object
 */
export const recalculateProductRatings = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { productId } = validatedData;

        if (productId) {
            // Recalculate for specific product
            const updatedRatings = await updateProductRatings(productId);
            
            res.status(httpStatus.OK).json(
                buildResponse(httpStatus.OK, {
                    message: 'Product ratings recalculated successfully',
                    productId,
                    updatedRatings
                })
            );
        } else {
            // Recalculate for all products that have reviews
            const productsWithReviews = await Review.distinct('product');
            const results = [];

            for (const prodId of productsWithReviews) {
                try {
                    const updatedRatings = await updateProductRatings(prodId);
                    results.push({
                        productId: prodId,
                        ...updatedRatings
                    });
                } catch (err) {
                    console.error(`Error updating ratings for product ${prodId}:`, err.message);
                    results.push({
                        productId: prodId,
                        error: err.message
                    });
                }
            }

            res.status(httpStatus.OK).json(
                buildResponse(httpStatus.OK, {
                    message: 'Bulk product ratings recalculation completed',
                    processedProducts: results.length,
                    results
                })
            );
        }

    } catch (err) {
        handleError(res, err);
    }
};


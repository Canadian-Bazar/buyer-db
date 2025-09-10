import ServiceReview from '../models/service-reviews.schema.js'
import Service from '../models/service.schema.js'
import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import httpStatus from "http-status"; 
import mongoose from "mongoose";
import { matchedData } from "express-validator";

/**
 * Updates service's avgRating and ratingsCount based on current reviews
 * @param {ObjectId} serviceId - The service ID to update ratings for
 * @param {ClientSession} session - Optional MongoDB session for transactions
 */
const updateServiceRatings = async (serviceId, session = null) => {
    const aggregationPipeline = [
        { $match: { service: new mongoose.Types.ObjectId(serviceId) } },
        { 
            $group: { 
                _id: null, 
                avgRating: { $avg: '$rating' },
                ratingsCount: { $sum: 1 }
            }
        }
    ];

    const aggregationResult = await ServiceReview.aggregate(aggregationPipeline);
    const ratings = aggregationResult[0] || { avgRating: 0, ratingsCount: 0 };

    // Round avgRating to 1 decimal place
    const roundedAvgRating = Math.round(ratings.avgRating * 10) / 10;

    const updateOptions = session ? { session } : {};
    
    await Service.findByIdAndUpdate(
        serviceId,
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

export const getServiceReviews = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { serviceId } = validatedData;

        const query = {
            service: new mongoose.Types.ObjectId(serviceId)
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



        const docs = await ServiceReview.find(query)
            .populate('buyer', 'fullName email profilePic avatar')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalDocs = await ServiceReview.countDocuments(query);
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



export const createOrUpdateServiceReview = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const buyerId = req.user._id;
            
            const { serviceId, rating, comment } = validatedData;

            const existingReview = await ServiceReview.findOne({
                service: new mongoose.Types.ObjectId(serviceId),
                buyer: new mongoose.Types.ObjectId(buyerId)
            }).session(session);

            let review;
            let statusCode;
            let message;

            if (existingReview) {
                review = await ServiceReview.findByIdAndUpdate(
                    existingReview._id,
                    {
                        rating,
                        updatedAt: new Date(),
                        comment
                    },
                    { new: true, runValidators: true, session }
                ).populate('buyer', 'fullName email profilePic avatar');

                statusCode = httpStatus.OK;
                message = 'Service review updated successfully';
            } else {
                const reviewData = {
                    service: new mongoose.Types.ObjectId(serviceId),
                    buyer: new mongoose.Types.ObjectId(buyerId),
                    rating,
                    comment
                };

                review = await ServiceReview.create([reviewData], { session });
                
                review = await ServiceReview.findById(review[0]._id)
                    .populate('buyer', 'fullName email profilePic avatar')
                    .session(session);

                statusCode = httpStatus.CREATED;
                message = 'Service review created successfully';
            }

            // Update service ratings
            const updatedRatings = await updateServiceRatings(serviceId, session);
            
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
                serviceRatings: updatedRatings
            })
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

export const deleteServiceReview = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const buyerId = req.user._id;
            const { reviewId } = validatedData;

            const review = await ServiceReview.findOneAndDelete({
                _id: new mongoose.Types.ObjectId(reviewId),
                buyer: new mongoose.Types.ObjectId(buyerId)
            }, { session });

            if (!review) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Service review not found or unauthorized');
            }

            // Update service ratings after deletion
            const updatedRatings = await updateServiceRatings(review.service, session);
            
            // Store response data for use after transaction
            req.responseData = {
                message: 'Service review deleted successfully',
                updatedRatings
            };
        });

        // Send response after transaction completes
        const { message, updatedRatings } = req.responseData;
        
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message,
                serviceRatings: updatedRatings
            })
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Utility function to recalculate ratings for a specific service or all services
 * This can be used for data migration or fixing inconsistencies
 * @param {req} req - Express request object
 * @param {res} res - Express response object
 */
export const recalculateServiceRatings = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { serviceId } = validatedData;

        if (serviceId) {
            // Recalculate for specific service
            const updatedRatings = await updateServiceRatings(serviceId);
            
            res.status(httpStatus.OK).json(
                buildResponse(httpStatus.OK, {
                    message: 'Service ratings recalculated successfully',
                    serviceId,
                    updatedRatings
                })
            );
        } else {
            // Recalculate for all services that have reviews
            const servicesWithReviews = await ServiceReview.distinct('service');
            const results = [];

            for (const svcId of servicesWithReviews) {
                try {
                    const updatedRatings = await updateServiceRatings(svcId);
                    results.push({
                        serviceId: svcId,
                        ...updatedRatings
                    });
                } catch (err) {
                    console.error(`Error updating ratings for service ${svcId}:`, err.message);
                    results.push({
                        serviceId: svcId,
                        error: err.message
                    });
                }
            }

            res.status(httpStatus.OK).json(
                buildResponse(httpStatus.OK, {
                    message: 'Bulk service ratings recalculation completed',
                    processedServices: results.length,
                    results
                })
            );
        }

    } catch (err) {
        handleError(res, err);
    }
};
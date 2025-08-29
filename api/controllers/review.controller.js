import Review from '../models/review.schema.js'
import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import httpStatus from "http-status"; 
import mongoose from "mongoose";
import { matchedData } from "express-validator";
import { validate } from 'node-cron';





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
        const skip = (page - 1) * limi1t;

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
            .populate('buyer', 'name email profilePic avatar')
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
    try {
        const validatedData = matchedData(req);
        const buyerId = req.user._id;
        
        const { productId, rating  , comment} = validatedData;

        const existingReview = await Review.findOne({
            product: new mongoose.Types.ObjectId(productId),
            buyer: new mongoose.Types.ObjectId(buyerId)
        });

        let review;

        if (existingReview) {
            review = await Review.findByIdAndUpdate(
                existingReview._id,
                {
                    rating,
                    updatedAt: new Date() ,
                    comment
                },
                { new: true, runValidators: true }
            ).populate('buyer', 'name email profilePic avatar');

            res.status(httpStatus.OK).json(
                buildResponse(httpStatus.OK, 
                   'Review updated successfully',
                   
                )
            );

        } else {
            const reviewData = {
                product: new mongoose.Types.ObjectId(productId),
                buyer: new mongoose.Types.ObjectId(buyerId),
                rating ,
                comment
            };

            review = await Review.create(reviewData);
            
            review = await Review.findById(review._id)
                .populate('buyer', 'name email profilePic avatar');

            res.status(httpStatus.CREATED).json(
                buildResponse(httpStatus.CREATED, 
                     'Review created successfully',
                
                )
            );
        }

    } catch (err) {
        handleError(res, err);
    }
};

export const deleteReview = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const buyerId = req.user._id;
        const { reviewId } = validatedData;

        const review = await Review.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(reviewId),
            buyer: new mongoose.Types.ObjectId(buyerId)
        });

        if (!review) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Review not found or unauthorized');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Review deleted successfully'
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};


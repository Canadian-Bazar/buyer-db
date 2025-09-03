import ServiceReview from '../models/service-reviews.schema.js'
import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import httpStatus from "http-status"; 
import mongoose from "mongoose";
import { matchedData } from "express-validator";




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
            .populate('buyer', 'name email profilePic avatar')
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
    try {
        const validatedData = matchedData(req);
        const buyerId = req.user._id;
        
        const { serviceId, rating  , comment} = validatedData;

        const existingReview = await ServiceReview.findOne({
            service: new mongoose.Types.ObjectId(serviceId),
            buyer: new mongoose.Types.ObjectId(buyerId)
        });

        let review;

        if (existingReview) {
            review = await ServiceReview.findByIdAndUpdate(
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
                   'Service review updated successfully',
                   
                )
            );

        } else {
            const reviewData = {
                service: new mongoose.Types.ObjectId(serviceId),
                buyer: new mongoose.Types.ObjectId(buyerId),
                rating ,
                comment
            };

            review = await ServiceReview.create(reviewData);
            
            review = await ServiceReview.findById(review._id)
                .populate('buyer', 'name email profilePic avatar');

            res.status(httpStatus.CREATED).json(
                buildResponse(httpStatus.CREATED, 
                     'Service review created successfully',
                
                )
            );
        }

    } catch (err) {
        handleError(res, err);
    }
};

export const deleteServiceReview = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const buyerId = req.user._id;
        const { reviewId } = validatedData;

        const review = await ServiceReview.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(reviewId),
            buyer: new mongoose.Types.ObjectId(buyerId)
        });

        if (!review) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service review not found or unauthorized');
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: 'Service review deleted successfully'
            })
        );

    } catch (err) {
        handleError(res, err);
    }
};
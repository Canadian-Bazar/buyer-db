// src/controllers/category.analytics.controller.js
import { matchedData } from 'express-validator';
import mongoose from 'mongoose';
import CategoryStats from '../models/category.stats.schema.js';
import CategoryInteraction from '../models/category.interaction.schema.js';
import handleError from '../utils/handleError.js';
import httpStatus from 'http-status';
import buildResponse from '../utils/buildResponse.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import categoryRedisService from '../services/redis/category.redis.service.js';
import userInteractionRedisService from '../services/redis/user.interaction.redis.service.js';

/**
 * This function will track category view
 */
export const trackCategoryView = async(req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user?._id;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Category ID');
    }
    
    // Track in Redis for batch processing
    await categoryRedisService.incrementCategoryView(categoryId);
    
    // Track user-specific interaction if user is logged in
    if (userId) {
      await userInteractionRedisService.trackUserCategoryInteraction(userId, categoryId, 'view');
    }
    
    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * This function will track category search
 */
export const trackCategorySearch = async(req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user?._id;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Category ID');
    }
    
    // Track in Redis for batch processing
    await categoryRedisService.incrementCategorySearch(categoryId);
    
    // Track user-specific interaction if user is logged in
    if (userId) {
      await userInteractionRedisService.trackUserCategoryInteraction(userId, categoryId, 'search');
    }
    
    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * This function will give all the popular categories
 */
export const getPopularCategories = async(req, res) => {
  try {
    const validatedData = matchedData(req);
    
    const page = Math.max(validatedData.page || 1, 1);
    const limit = Math.min(validatedData.limit || 10, 15);
    const search = validatedData.search || '';
    const skip = (page - 1) * limit;
    
    const matchStage = {};
    if (search) {
      matchStage['category.name'] = { $regex: search, $options: 'i' };
    }
    
    const result = await CategoryStats.aggregate([
      {
        $lookup: {
          from: 'Category',
          foreignField: '_id',
          localField: 'categoryId',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: matchStage },
      {
        $facet: {
          categories: [
            { $sort: { popularityScore: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                categoryId: 1,
                name: '$category.name',
                description: '$category.description',
                image: '$category.image',
                popularityScore: 1,
                viewCount: 1,
                searchCount: 1
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    const categories = result[0].categories;
    const totalCount = result[0].totalCount[0]?.count || 0;
    
    const totalPages = Math.ceil(totalCount / limit);
    
    const response = {
      docs: categories,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * This function will give user's frequently interacted categories
 */
export const getUserFrequentCategories = async(req, res) => {
  try {
    const userId = req.user._id;
    const validatedData = matchedData(req);
    
    if (!userId) {
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'You must be logged in to access this resource');
    }
    
    const page = Math.max(validatedData.page || 1, 1);
    const limit = Math.min(validatedData.limit || 10, 15);
    const skip = (page - 1) * limit;
    
    const result = await CategoryInteraction.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'Category',
          foreignField: '_id',
          localField: 'categoryId',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $addFields: {
          interactionScore: { $add: ['$viewCount', { $multiply: ['$searchCount', 2] }] }
        }
      },
      {
        $facet: {
          categories: [
            { $sort: { interactionScore: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                categoryId: 1,
                name: '$category.name',
                description: '$category.description',
                image: '$category.image',
                viewCount: 1,
                searchCount: 1,
                lastInteracted: 1,
                interactionScore: 1
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    const categories = result[0].categories;
    const totalCount = result[0].totalCount[0]?.count || 0;
    
    const totalPages = Math.ceil(totalCount / limit);
    
    const response = {
      docs: categories,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      totalCount,
      page
    };
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * This function will give real-time category statistics
 */
export const getRealTimeCategoryStats = async(req, res) => {
  try {
    const { categoryId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Category ID');
    }
    
    const stats = await categoryRedisService.getCategoryStats(categoryId);
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { categoryId, stats }));
  } catch (err) {
    handleError(res, err);
  }
};


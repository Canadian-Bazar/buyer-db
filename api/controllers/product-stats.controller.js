import ProductStats from '../models/products-stats.schema.js';
import productActivityService from '../redis/product-activity.redis.js';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { matchedData } from 'express-validator';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import  handleError  from '../utils/handleError.js';

/**
 * Track product view
 */
export const trackProductView = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { productId } = validatedData;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Product ID');
    }

    await productActivityService.trackProductActivity(productId, userId, 'view');

    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Track quotation status change
 */
export const trackQuotationStatus = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { quotationId, productId, status } = validatedData;

    if (!mongoose.Types.ObjectId.isValid(quotationId) || !mongoose.Types.ObjectId.isValid(productId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid ID');
    }

    await productActivityService.trackQuotationStatus(productId, quotationId, status);

    res.status(httpStatus.NO_CONTENT).json(buildResponse(httpStatus.NO_CONTENT));
  } catch (err) {
    handleError(res, err);
  }
};

/**
 * Get popular products with pagination
 */
export const getPopularProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalCount = await ProductStats.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);
    
    const popularProducts = await ProductStats.find()
      .sort({ popularityScore: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name description images categoryId seller priceRange')
      .lean();
      
    const docs = popularProducts.map(stats => ({
      product: stats.productId,
      viewCount: stats.viewCount,
      quotationCount: stats.quotationCount,
      popularityScore: stats.popularityScore
    }));
    
    const response = {
      docs,
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
 * Get bestseller products with pagination
 */
export const getBestsellerProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    const skip = (page - 1) * limit;
    
    // Get total count
    const totalCount = await ProductStats.countDocuments({
      acceptedQuotationCount: { $gt: 0 }
    });
    const totalPages = Math.ceil(totalCount / limit);
    
    const bestsellers = await ProductStats.find({
      acceptedQuotationCount: { $gt: 0 }
    })
      .sort({ bestsellerScore: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name description images categoryId seller priceRange')
      .lean();
      
    const docs = bestsellers.map(stats => ({
      product: stats.productId,
      quotationCount: stats.quotationCount,
      acceptedQuotationCount: stats.acceptedQuotationCount,
      acceptanceRate: stats.quotationCount > 0 ? 
        (stats.acceptedQuotationCount / stats.quotationCount) : 0,
      bestsellerScore: stats.bestsellerScore
    }));
    
    const response = {
      docs,
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
 * Get products by category with analytics and pagination
 */
export const getProductsByCategoryWithAnalytics = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { categoryId } = validatedData;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    if (page < 1) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Page must be greater than 0');
    }
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Category ID');
    }
    
    // First, get product IDs that match the category
    const matchingProductIds = await mongoose.model('Product')
      .find({ categoryId })
      .select('_id')
      .lean()
      .then(products => products.map(p => p._id));
    
    // Get total count
    const totalCount = await ProductStats.countDocuments({
      productId: { $in: matchingProductIds }
    });
    const totalPages = Math.ceil(totalCount / limit);
    
    const skip = (page - 1) * limit;
    
    // Get stats for these products
    const products = await ProductStats.find({
      productId: { $in: matchingProductIds }
    })
      .sort({ popularityScore: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productId', 'name description images seller priceRange')
      .lean();
    
    const docs = products.map(stats => ({
      product: stats.productId,
      viewCount: stats.viewCount,
      quotationCount: stats.quotationCount,
      acceptedQuotationCount: stats.acceptedQuotationCount,
      popularityScore: stats.popularityScore
    }));
    
    const response = {
      docs,
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

export default {
  trackProductView,
  trackQuotationStatus,
  getPopularProducts,
  getBestsellerProducts,
  getProductsByCategoryWithAnalytics
};
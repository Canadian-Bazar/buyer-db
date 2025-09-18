import Product from '../models/products.schema.js'
import Service from '../models/service.schema.js'
import Seller from '../models/seller.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import mongoose from 'mongoose'
import { matchedData } from 'express-validator'
import Category from '../models/category.schema.js'



export const unifiedSearchController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const page = Math.max(parseInt(validatedData.page) || 1, 1);
    const limit = Math.min(parseInt(validatedData.limit) || 10, 50);
    const skip = (page - 1) * limit;
    
    const searchQuery = validatedData.search || '';
    const filter = validatedData.filter || 'all';

    let results = [];

    const searchConditions = searchQuery ? {
      $or: [
        { name: { $regex: `^${searchQuery}`, $options: 'i' } },
        { description: { $regex: `^${searchQuery}`, $options: 'i' } }
      ]
    } : {};

    if (filter === 'all' || filter === 'products') {
      const productPipeline = [
        {
          $match: {
            ...searchConditions,
            completionPercentage: 100,
            isBlocked: false,
            isArchived: false,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryArr'
          }
        },
        { $addFields: { categoryDoc: { $arrayElemAt: ['$categoryArr', 0] } } },
        {
          $addFields: {
            parentCategoryId: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$categoryDoc.ancestors', []] } }, 0] },
                then: { $arrayElemAt: ['$categoryDoc.ancestors', 0] },
                else: '$categoryDoc.parentCategory'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'parentCategoryId',
            foreignField: '_id',
            as: 'parentCategoryDocArr'
          }
        },
        { $addFields: { parentCategoryDoc: { $arrayElemAt: ['$parentCategoryDocArr', 0] } } },
        {
          $project: {
            _id: 1,
            name: 1,
            type: { $literal: 'product' },
            images: { $ifNull: ['$images', []] },
            parentCategory: '$parentCategoryDoc.slug'
          }
        }
      ];

      const products = await Product.aggregate(productPipeline);
      results = [...results, ...products];
    }

    if (filter === 'all' || filter === 'services') {
      const servicePipeline = [
        {
          $match: {
            ...searchConditions,
            completionPercentage: 100,
            isBlocked: false,
            isArchived: false,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryArr'
          }
        },
        { $addFields: { categoryInfo: { $arrayElemAt: ['$categoryArr', 0] } } },
        {
          $addFields: {
            parentCategoryId: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$categoryInfo.ancestors', []] } }, 0] },
                then: { $arrayElemAt: ['$categoryInfo.ancestors', 0] },
                else: '$categoryInfo.parentCategory'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'parentCategoryId',
            foreignField: '_id',
            as: 'parentCategoryDocArr'
          }
        },
        { $addFields: { parentCategoryDoc: { $arrayElemAt: ['$parentCategoryDocArr', 0] } } },
        {
          $lookup: {
            from: 'ServiceMedia',
            localField: '_id',
            foreignField: 'serviceId',
            as: 'media'
          }
        },
        {
          $unwind: {
            path: '$media',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            type: { $literal: 'service' },
            images: {
              $ifNull: [
                { $slice: ['$media.images', 1] },
                []
              ]
            },
            parentCategory: '$parentCategoryDoc.slug'
          }
        }
      ];

      const services = await Service.aggregate(servicePipeline);
      results = [...results, ...services];
    }

    if (filter === 'all' || filter === 'sellers') {
      // Sellers: search by companyName
      const sellerPipeline = [
        {
          $match: searchQuery
            ? { companyName: { $regex: `^${searchQuery}`, $options: 'i' } }
            : {},
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'categories',
            foreignField: '_id',
            as: 'categoryDocs',
          },
        },
        {
          $addFields: {
            firstCategory: { $arrayElemAt: ['$categoryDocs', 0] },
          },
        },
        {
          $addFields: {
            parentCategoryId: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ['$firstCategory.ancestors', []] } }, 0] },
                then: { $arrayElemAt: ['$firstCategory.ancestors', 0] },
                else: '$firstCategory.parentCategory'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Category',
            localField: 'parentCategoryId',
            foreignField: '_id',
            as: 'parentCategoryDocArr'
          }
        },
        { $addFields: { parentCategoryDoc: { $arrayElemAt: ['$parentCategoryDocArr', 0] } } },
        {
          $project: {
            _id: 1,
            name: '$companyName',
            type: { $literal: 'seller' },
            images: {
              $cond: [
                { $ifNull: ['$logo', false] },
                [{ $ifNull: ['$logo', null] }],
                [],
              ],
            },
            parentCategory: '$parentCategoryDoc.slug'
          },
        },
      ];

      const sellers = await Seller.aggregate(sellerPipeline);
      results = [...results, ...sellers];
    }

    // Apply pagination
    const paginatedResults = results.slice(skip, skip + limit);
    const totalItems = results.length;
    const totalPages = Math.ceil(totalItems / limit);

    const response = {
      results: paginatedResults,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages
    };

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));

  } catch (error) {
    console.error('Unified search error:', error);
    handleError(res, error);
  }
};

export const getCategoryBreadcrumb = async (categoryId) => {
  try {
    const hierarchy = await Category.buildCategoryHierarchy(categoryId);
    return hierarchy ? hierarchy.fullHierarchy.map(cat => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug
    })) : [];
  } catch (error) {
    console.error('Error building category breadcrumb:', error);
    return [];
  }
};
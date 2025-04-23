import { matchedData } from 'express-validator';
import Category from '../models/category.schema.js';
import  httpStatus  from 'http-status';
import buildResponse from '../utils/buildResponse.js';
import mongoose from 'mongoose';




export const getAllCategories = async (req, res) => {
  try {

    const validatedData = matchedData(req);

    const page = Math.max(parseInt(validatedData.page) || 1, 1)
    const limit = Math.max(parseInt(validatedData.limit) || 10, 1)
    const skip = (page - 1) * limit

    const filter = { isActive: true, parentCategory: { $exists: false } }
    const [totalDocs, categories] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .sort({ name: 1 })
        .limit(limit)
        .skip(skip)
    ])
    const totalPages = Math.ceil(totalDocs / limit)

    const response = {
      docs: categories,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      currentPage: page,
      totalDocs
    }



    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res , error)
  }
}



export const getSubCategories = async (req, res) => {
  try {
    const validatedData = matchedData(req);

    const page = Math.max(parseInt(validatedData.page) || 1, 1);
    const limit = Math.max(parseInt(validatedData.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const parentCategoryId = validatedData.parentCategoryId;

    let filter = {
      isActive: true
    };

    if (parentCategoryId) {
      filter.parentCategory = { $exists: true };
      filter.ancestors = parentCategoryId;
    }

    const [totalDocs, categories] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter).sort({ name: 1 }).limit(limit).skip(skip)
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    const response = {
      docs: categories,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      totalPages,
      currentPage: page,
      totalDocs
    };

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

import Blogs from '../models/blogs.schema.js';
import Products from '../models/products.schema.js';
import Categories from '../models/category.schema.js';
import Services from '../models/service.schema.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';

export const getBlogsSlugs = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true }, slug: { $ne: null } };
    const blogsSlugs = await Blogs.find(filter).select('slug -_id').lean();

    const data = blogsSlugs.map((blog) => blog.slug);

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { data }));
  } catch (err) {
    handleError(res, err);
  }
};

export const getProductsSlugs = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true }, completionPercentage: 100 };
    const productsSlugs = await Products.find(filter)
      .select('slug -_id')
      .lean();

    const data = productsSlugs.map((p) => p.slug);

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { data }));
  } catch (err) {
    handleError(res, err);
  }
};

export const getServicesSlugs = async (req, res) => {
  try {
    const filter = { isDeleted: { $ne: true }, completionPercentage: 100 };
    const servicesSlugs = await Services.find(filter)
      .select('slug -_id')
      .lean();

    const data = servicesSlugs.map((s) => s.slug);

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { data }));
  } catch (err) {
    handleError(res, err);
  }
};

export const getCategoriesSlugs = async (req, res) => {
  try {
    const { slug } = matchedData(req);

    let filter = { isActive: true };

    if (slug) {
      const category = await Categories.findOne({ slug });
      if (!category) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(buildResponse(httpStatus.NOT_FOUND, 'Category not found'));
      }

      const categoryIds = new Set([category._id.toString()]);

      if (category.ancestors?.length) {
        category.ancestors.forEach((a) => categoryIds.add(a.toString()));
      }

      const children = await Categories.find({
        $or: [{ parentCategory: category._id }, { ancestors: category._id }],
      }).select('_id');

      children.forEach((c) => categoryIds.add(c._id.toString()));

      filter = { ...filter, _id: { $in: Array.from(categoryIds) } };
    }

    const categorySlugs = await Categories.find(filter)
      .select('slug -_id')
      .lean();

    const data = categorySlugs.map((c) => c.slug);

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { data }));
  } catch (err) {
    handleError(res, err);
  }
};

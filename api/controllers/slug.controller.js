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

    // If a slug is provided, return that parent and its direct subcategories in
    // the format: ["parent", "parent/child", ...]
    if (slug) {
      const parent = await Categories.findOne({ slug, isActive: true }).select(
        '_id slug',
      );
      if (!parent) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(buildResponse(httpStatus.NOT_FOUND, 'Category not found'));
      }

      const subcategories = await Categories.find({
        isActive: true,
        parentCategory: parent._id,
      })
        .select('slug parentCategory -_id')
        .lean();

      const data = [
        parent.slug,
        ...subcategories.map((c) => `${parent.slug}/${c.slug}`),
      ];
      return res
        .status(httpStatus.OK)
        .json(buildResponse(httpStatus.OK, { data }));
    }

    // No slug: return all parents (with at least one child) and their direct
    // subcategories in a single flat list formatted as requested
    const parentIds = await Categories.distinct('parentCategory', {
      isActive: true,
      parentCategory: { $ne: null },
    });

    if (!parentIds.length) {
      return res
        .status(httpStatus.OK)
        .json(buildResponse(httpStatus.OK, { data: [] }));
    }

    const [parents, children] = await Promise.all([
      Categories.find({ isActive: true, _id: { $in: parentIds } })
        .select('_id slug')
        .lean(),
      Categories.find({ isActive: true, parentCategory: { $in: parentIds } })
        .select('slug parentCategory')
        .lean(),
    ]);

    // Group children by parentCategory id string
    const childrenByParentId = children.reduce((acc, child) => {
      const pid = String(child.parentCategory);
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(child.slug);
      return acc;
    }, {});

    // Build flat list in the desired format
    const data = [];
    for (const p of parents) {
      data.push(p.slug);
      const subs = childrenByParentId[String(p._id)] || [];
      for (const s of subs) {
        data.push(`${p.slug}/${s}`);
      }
    }
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { data }));
  } catch (err) {
    handleError(res, err);
  }
};

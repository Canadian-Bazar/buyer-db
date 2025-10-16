import Sellers from '../models/seller.schema.js';
import LandingFeature from '../models/landing-feature.schema.js';
import HomeSettings from '../models/home-settings.schema.js';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import buildResponse from '../utils/buildResponse.js';
import { matchedData } from 'express-validator';
import httpStatus from 'http-status';



export const getRecentSellers = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const page = validatedData.page || 1;
    const limit = Math.min(validatedData.limit || 5, 20);

    const query = {
      isBlocked: { $ne: true },
      isVerified: true,
      isProfileComplete: true,
      approvalStatus: "approved",
    };

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      select: "-password -email -phone -stripeCustomerId", 
      lean: true,
      populate: [
        {
          path: "categories",
          select: "name _id", 
        },
        {
          path: "businessType",
          select: "name _id", 
        },
      ],
    };

    const result = await Sellers.paginate(query, options);

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        docs: result.docs,
        page: result.page,
        limit: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
      })
    );
  } catch (err) {
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json(buildResponse(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const getHeroSettings = async (_req, res) => {
  try {
    const settings = await HomeSettings.findOne({}).sort({ updatedAt: -1 }).lean();
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, settings || {}));
  } catch (err) {
    handleError(res, err);
  }
};

export const listHeroSettings = async (_req, res) => {
  try {
    const docs = await HomeSettings.find({ isActive: true })
      .sort({ updatedAt: 1 })
      .limit(4)
      .lean();
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { docs }));
  } catch (err) {
    handleError(res, err);
  }
};

export const getLandingFeatures = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const limit = Math.min(Number(validatedData.limit || 10), 50);

    const features = await LandingFeature.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        docs: features,
      })
    );
  } catch (err) {
    handleError(res, err);
  }
};
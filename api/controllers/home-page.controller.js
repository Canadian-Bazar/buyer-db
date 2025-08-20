import Sellers from '../models/seller.schema.js';
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
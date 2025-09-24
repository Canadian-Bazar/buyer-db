import Service from '../models/service.schema.js';
import Seller from '../models/seller.schema.js';
import ServicePricing from '../models/service-pricing.schema.js';
import Category from '../models/category.schema.js';

import mongoose from 'mongoose';
import { matchedData } from 'express-validator';
import handleError from '../utils/handleError.js';
import buildResponse from '../utils/buildResponse.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import httpStatus from 'http-status';



export const getServicesController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const pipeline = [];
    
    const page = parseInt(validatedData.page || 1, 10);
    const limit = Math.min(parseInt(validatedData.limit || 10, 10), 50);
    const offset = (page - 1) * limit;

    const matchStage = {
      isBlocked: false,
      isArchived: false,
    };

    // Show all except explicitly inactive by default or when isActive=true is requested
    if (validatedData.isActive !== undefined) {
      const wantsActive = (validatedData.isActive === true || validatedData.isActive === 'true');
      if (wantsActive) {
        matchStage.isActive = { $ne: false };
      } else {
        matchStage.isActive = false;
      }
    } else {
      matchStage.isActive = { $ne: false };
    }

    // Do not force completionPercentage to 100 so more services are visible by default
    if (validatedData.completionPercentage) {
      const value = parseInt(validatedData.completionPercentage, 10);
      if (!Number.isNaN(value)) matchStage.completionPercentage = value;
    }


    if (validatedData.search) {
      matchStage.name = {
        $regex: validatedData.search,
        $options: 'i'
      };
    }

    if (validatedData.category) {
      matchStage.category = new mongoose.Types.ObjectId(validatedData.category);
    }
    // Support multiple subcategories similar to product API
    if (validatedData.subcategories) {
      const ids = String(validatedData.subcategories)
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
        .map((id) => new mongoose.Types.ObjectId(id));
      if (ids.length > 0) {
        matchStage.category = { $in: ids };
      }
    }


    pipeline.push({ $match: matchStage });

    pipeline.push({
      $lookup: {
        from: 'Sellers',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerInfo'
      }
    });
    pipeline.push({
      $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true }
    });

    const sellerMatchStage = {};
    
    if (validatedData.city) {
      sellerMatchStage['sellerInfo.city'] = {
        $regex: validatedData.city,
        $options: 'i'
      };
    }

    if (validatedData.state) {
      // Exact match for state codes (e.g., CA provinces) to avoid over-filtering
      sellerMatchStage['sellerInfo.state'] = validatedData.state;
    }

    if (validatedData.isVerified !== undefined) {
      sellerMatchStage['sellerInfo.isVerified'] = (validatedData.isVerified === true || validatedData.isVerified === 'true');
    }

    if (validatedData.businessType) {
      sellerMatchStage['sellerInfo.businessType'] = new mongoose.Types.ObjectId(validatedData.businessType);
    }

    if (Object.keys(sellerMatchStage).length > 0) {
      pipeline.push({ $match: sellerMatchStage });
    }



    pipeline.push({
      $lookup: {
        from: 'ServicePricing',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'pricing'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$pricing',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'ServiceMedia',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'media'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$media',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'Category',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    });

    let sortStage = { createdAt: -1 };
    switch (validatedData.sortBy) {
      case 'priceAsc':
        sortStage = { 'pricing.perModelPrice': 1 };
        break;
      case 'priceDesc':
        sortStage = { 'pricing.perModelPrice': -1 };
        break;
      case 'newest':
        sortStage = { createdAt: -1 };
        break;
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      default:
        // If ratings order requested
        if (validatedData.ratings === 'asc') sortStage = { avgRating: 1 };
        if (validatedData.ratings === 'desc') sortStage = { avgRating: -1 };
        break;
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({ $skip: offset });
    pipeline.push({ $limit: limit });

    pipeline.push({
      $project: {
        name: 1,
        description: 1,
        slug: 1,
        avgRating: 1,
        ratingsCount: 1,
        images: { $slice: ['$media.images', 3] },
        customQuoteEnabled: '$pricing.customQuoteEnabled',
        completionPercentage: 1,
        isComplete: 1,
        createdAt: 1,
        
        sellerInfo: {
          _id: '$sellerInfo._id',
          companyName: '$sellerInfo.companyName',
          city: '$sellerInfo.city',
          state: '$sellerInfo.state',
          isVerified: '$sellerInfo.isVerified',
          logo: '$sellerInfo.logo'
        },
        
        categoryName: { 
          $ifNull: [{ $arrayElemAt: ['$categoryInfo.name', 0] }, null] 
        }
      }
    });



    const services = await Service.aggregate(pipeline);

    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'Sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } }
    ];

    if (Object.keys(sellerMatchStage).length > 0) {
      countPipeline.push({ $match: sellerMatchStage });
    }

    countPipeline.push({ $count: 'count' });

    const countResult = await Service.aggregate(countPipeline);
    const total = countResult[0]?.count || 0;

    const response = {
      docs: services,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasPrev: page > 1,
      hasNext: page * limit < total
    };

    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

export const getServiceDetailsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const { identifier } = validatedData;

    if (!identifier) {
      return res.status(httpStatus.BAD_REQUEST).json(
        buildResponse(httpStatus.BAD_REQUEST, null, 'Service identifier is required')
      );
    }

    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    const isObjectId = mongoIdRegex.test(identifier);

    const pipeline = [];

    const matchQuery = {
      isBlocked: false,
      isArchived: false,
      // Allow fetching even if incomplete; UI can handle presentation
      // completionPercentage: 100,
      // Consider any service active unless explicitly false
      isActive: { $ne: false }
    };

    if (isObjectId) {
      matchQuery._id = new mongoose.Types.ObjectId(identifier);
    } else {
      matchQuery.slug = identifier;
    }


    pipeline.push({
      $match: matchQuery
    });

    pipeline.push({
      $lookup: {
        from: 'Sellers',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerInfo'
      }
    });
    pipeline.push({
      $unwind: '$sellerInfo'
    });

    pipeline.push({
      $lookup: {
        from: 'Category',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$categoryInfo',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'ServicePricing',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'pricing'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$pricing',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'ServiceMedia',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'media'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$media',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'ServiceOrderSchema',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'orderInfo'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$orderInfo',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'ServiceCustomization',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'customization'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$customization',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $lookup: {
        from: 'SerivesProcessAndCapability',
        localField: '_id',
        foreignField: 'serviceId',
        as: 'capabilities'
      }
    });
    pipeline.push({
      $unwind: {
        path: '$capabilities',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $project: {
        name: 1,
        description: 1,
        slug: 1,
        avgRating: 1,
        ratingsCount: 1,
        isComplete: 1,
        completionPercentage: 1,
        incompleteSteps: 1,
        stepStatus: 1,
        createdAt: 1,
        updatedAt: 1,

        seller: {
          _id: '$sellerInfo._id',
          companyName: '$sellerInfo.companyName',
          email: '$sellerInfo.email',
          phone: '$sellerInfo.phone',
          city: '$sellerInfo.city',
          state: '$sellerInfo.state',
          zip: '$sellerInfo.zip',
          street: '$sellerInfo.street',
          isVerified: '$sellerInfo.isVerified',
          logo: '$sellerInfo.logo',
          companyWebsite: '$sellerInfo.companyWebsite',
          yearEstablished: '$sellerInfo.yearEstablished',
          numberOfEmployees: '$sellerInfo.numberOfEmployees',
          certifications: '$sellerInfo.certifications',
          socialMediaLinks: '$sellerInfo.socialMediaLinks'
        },

        category: {
          _id: '$categoryInfo._id',
          name: '$categoryInfo.name'
        },

        pricing: {
          perModelPrice: '$pricing.perModelPrice',
          perHourPrice: '$pricing.perHourPrice',
          perBatchPrice: '$pricing.perBatchPrice',
          volume: '$pricing.volume',
          customQuoteEnabled: '$pricing.customQuoteEnabled'
        },

        media: {
          images: '$media.images',
          videos: '$media.videos',
          warranty: '$media.warranty',
          industryCertifications: '$media.industryCertifications',
          brochure: '$media.brochure'
        },

        orderInfo: {
          moq: '$orderInfo.moq',
          standardLeadTime: '$orderInfo.standardLeadTime',
          rushOptions: '$orderInfo.rushOptions'
        },

        customization: {
          designImages: '$customization.designImages',
          logo: '$customization.logo',
          colorChoices: '$customization.colorChoices',
          rapidPrototype: '$customization.rapidPrototype'
        },

        capabilities: {
          processType: '$capabilities.processType',
          materialsSupported: '$capabilities.materialsSupported',
          surfaceFinishAndCoatings: '$capabilities.surfaceFinishAndCoatings',
          tolerance: '$capabilities.tolerance'
        }
      }
    });

    const serviceDetails = await Service.aggregate(pipeline);


    if (!serviceDetails.length) {
      return res.status(httpStatus.NOT_FOUND).json(
        buildResponse(httpStatus.NOT_FOUND, null, 'Service not found')
      );
    }

    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, serviceDetails[0])
    );
  } catch (err) {
    handleError(res, err);
  }
};
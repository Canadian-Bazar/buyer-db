import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import StoreClaimUsers from '../models/store-claim-users.schema.js'
import  { matchedData } from 'express-validator';
import httpStatus from 'http-status';
import Category from '../models/category.schema.js'
import mongoose from 'mongoose';



export const getStoresController = async (req, res) => {
    try {
        const validatedData = matchedData(req);

        const page = validatedData.page || 1;
        const limit = Math.min(validatedData.limit || 10, 50);

        // Build filter object
        const filter = {};

        console.log("validatedData:", validatedData);

        // isClaimed filter logic
        if (validatedData.isClaimed !== undefined) {
            if (parseInt(validatedData.isClaimed) === 0) {
                filter.isClaimed = false; // Only unclaimed
            } else if (parseInt(validatedData.isClaimed) === 1) {
                filter.isClaimed = true; // Only claimed
            }
            // If isClaimed is not 0 or 1, fetch all (no filter applied)
        }

        // Location filters
        if (validatedData.province) {
            filter.province = {
                $regex: validatedData.province,
                $options: 'i'
            };
        }

        if (validatedData.city) {
            filter.city = {
                $regex: validatedData.city,
                $options: 'i'
            };
        }

        if (validatedData.street) {
            filter.street = {
                $regex: validatedData.street,
                $options: 'i'
            };
        }

        // State filter (mapping to province)
        if (validatedData.state) {
            filter.province = {
                $regex: validatedData.state,
                $options: 'i'
            };
        }

        // Category filter with hierarchy support (ALWAYS ENABLED)
        if (validatedData.category) {
            const categoryId = validatedData.category;
            
            try {
                // Import Category model (make sure it's imported at the top)
                // import Category from '../models/Category.js';
                
                const selectedCategory = await Category.findById(categoryId);
                
                if (selectedCategory) {
                    // Always create array of category IDs including the selected category and all its ancestors
                    const categoryIds = [
                        new mongoose.Types.ObjectId(categoryId),
                        ...selectedCategory.ancestors
                    ];
                    
                    filter.category = { $in: categoryIds };
                    console.log("Category hierarchy filter applied:", categoryIds);
                } else {
                    // If category not found, use original filter
                    filter.category = categoryId;
                }
            } catch (categoryError) {
                console.warn("Error fetching category hierarchy, falling back to exact match:", categoryError);
                filter.category = categoryId;
            }
        }

        // Search filter (existing logic)
        if (validatedData.search) {
            filter.$or = [
                {
                    companyName: {
                        $regex: validatedData.search,
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: validatedData.search,
                        $options: 'i'
                    }
                },
                {
                    phoneNumber: {
                        $regex: validatedData.search,
                        $options: 'i'
                    }
                }
            ];
        }

        console.log("Applied filter:", JSON.stringify(filter, null, 2));

        // Build aggregation pipeline for better performance and category info
        const aggregationPipeline = [
            { $match: filter },
            
            // Lookup category information if category filter is applied
            ...(validatedData.category ? [{
                $lookup: {
                    from: "Category",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            }, {
                $addFields: {
                    categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
                    categorySlug: { $arrayElemAt: ["$categoryInfo.slug", 0] }
                }
            }, {
                $project: {
                    categoryInfo: 0 // Remove the lookup data to keep response clean
                }
            }] : []),
            
            // Skip and limit for pagination
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ];

        // Execute aggregation
        const stores = await StoreClaimUsers.aggregate(aggregationPipeline);
        
        // Get total count
        const totalAggregation = [
            { $match: filter },
            { $count: "total" }
        ];
        
        const totalResult = await StoreClaimUsers.aggregate(totalAggregation);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        const response = {
            docs: stores,
            hasPrev: page > 1,
            hasNext: (limit * page) < total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalDocs: total,
            filters: {
                appliedFilters: Object.keys(filter),
                hierarchyEnabled: true, // Always enabled now
                categoryFilter: validatedData.category || null
            }
        };

        res
            .status(httpStatus.OK)
            .json(buildResponse(httpStatus.OK, response));

    } catch (err) {
        console.error("Error in getStoresController:", err);
        handleError(res, err);
    }
};



export const getCategoryUnclaimedStoresController = async (req, res) => {
    try {
        const validatedData = matchedData(req);

        const categoriesWithStores = await StoreClaimUsers.aggregate([
            {
                $match: {
                    isClaimed: false,
                    category: { $exists: true, $ne: null, $type: "objectId" }
                }
            },
            
            {
                $lookup: {
                    from: "Category", // Adjust if your collection name is different
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            
            {
                $match: {
                    categoryData: { $ne: [] }
                }
            },
            
            {
                $addFields: {
                    categoryName: { $arrayElemAt: ["$categoryData.name", 0] }
                }
            },
            
            {
                $project: {
                    categoryData: 0
                }
            },
            
            {
                $group: {
                    _id: "$category",
                    categoryName: { $first: "$categoryName" },
                    stores: { $push: "$$ROOT" }
                }
            },
            
            {
                $addFields: {
                    randomField: { $rand: {} }
                }
            },
            
            {
                $sort: { randomField: 1 }
            },
            
            // Limit to 6 categories
            {
                $limit: 6
            },
            
            // Clean up
            {
                $project: {
                    categoryName: 1,
                    stores: 1
                }
            }
        ]);

        // Helper function for better randomization
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Process the results to get the required distribution
        const processedResult = [];
        
        // Shuffle categories once more for extra randomness
        const shuffledCategories = shuffleArray(categoriesWithStores);

        // First 2 categories: 2 stores each
        for (let i = 0; i < Math.min(2, shuffledCategories.length); i++) {
            const category = shuffledCategories[i];
            const shuffledStores = shuffleArray(category.stores);
            const selectedStores = shuffledStores.slice(0, Math.min(2, shuffledStores.length));
            
            processedResult.push({
                categoryName: category.categoryName,
                shops: selectedStores
            });
        }

        // Next 4 categories: 1 store each
        for (let i = 2; i < Math.min(6, shuffledCategories.length); i++) {
            const category = shuffledCategories[i];
            const shuffledStores = shuffleArray(category.stores);
            const selectedStores = shuffledStores.slice(0, Math.min(1, shuffledStores.length));
            
            processedResult.push({
                categoryName: category.categoryName,
                shops: selectedStores
            });
        }

        // Fill with empty categories if we have less than 6 categories
        // (Optional - remove if you don't want empty placeholders)
        while (processedResult.length < 6) {
            processedResult.push({
                categoryName: null,
                shops: []
            });
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, processedResult));

    } catch (err) {
        handleError(res, err);
    }
};



export const getRandomStoresController = async (req, res) => {
    try {
        const validatedData = matchedData(req);

        let limit = Math.min(parseInt(validatedData.limit, 10) || 8, 20);
        let page = Math.max(parseInt(validatedData.page, 10) || 1, 1);
        let skip = (page - 1) * limit;

        // First get the total count of unclaimed stores with category populated
        const totalStoresCount = await StoreClaimUsers.aggregate([
            {
                $match: {
                    isClaimed: false,
                    category: { $exists: true, $ne: null, $type: "objectId" }
                }
            },
            {
                $lookup: {
                    from: "Category",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            {
                $match: {
                    categoryData: { $ne: [] }
                }
            },
            {
                $count: "total"
            }
        ]);

        const totalStores = totalStoresCount[0]?.total || 0;

        const randomStores = await StoreClaimUsers.aggregate([
            {
                $match: {
                    isClaimed: false,
                    category: { $exists: true, $ne: null, $type: "objectId" }
                }
            },
            {
                $lookup: {
                    from: "Category",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },
            {
                $match: {
                    categoryData: { $ne: [] }
                }
            },
            {
                $addFields: {
                    categoryName: { $arrayElemAt: ["$categoryData.name", 0] }
                }
            },
            {
                $project: {
                    categoryData: 0
                }
            },
            {
                $addFields: {
                    randomField: { $rand: {} }
                }
            },
            {
                $sort: { randomField: 1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    randomField: 0
                }
            }
        ]);

        // Build response with same format as getStoresController
        const response = {
            docs: randomStores,
            hasPrev: page > 1,
            hasNext: (limit * page) < totalStores,
            totalPages: Math.ceil(totalStores / limit),
            currentPage: page,
            totalDocs: totalStores
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
        
    } catch (err) {
        handleError(res, err);
    }
};






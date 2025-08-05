import { check , query , param , body } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import { paginationValidator } from "./pagination.validator.js";


export const validateGetProductReviews = [
    ...paginationValidator,
    
    query('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid Product ID'),
    
    query('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be an integer between 1 and 5'),
    
    query('oldestFirst')
        .optional()
        .isBoolean()
        .withMessage('oldestFirst must be a boolean') ,


    query('sortByRating')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortByRating must be either asc or  desc') ,


        (re , res , next) => validateRequest(re , res , next)
];

export const validateCreateOrUpdateReview = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid Product ID'),
    
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be an integer between 1 and 5') ,


    body('comment')
        .notEmpty()
        .withMessage('Comment is required')
        .isString()
        .withMessage('Comment must be a string')  ,
                (re , res , next) => validateRequest(re , res , next)

];

export const validateDeleteReview = [
    param('reviewId')
        .notEmpty()
        .withMessage('Review ID is required')
        .isMongoId()
        .withMessage('Invalid Review ID') ,

            (re , res , next) => validateRequest(re , res , next)

];


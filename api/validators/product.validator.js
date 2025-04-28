import { check , query , param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from './../utils/validateRequest.js';




export const validateGetProducts=[
   ...paginationValidator ,
   query('search')
     .optional()
     .isString()
     .withMessage('Search has to be a string') ,

    query('minPrice') 
    .optional()
    .isNumeric()
    .withMessage('Min Price should be a number') ,

    query('maxPrice') 
    .optional()
    .isNumeric()
    .withMessage('Max Price should be a number') ,

    query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Is Verified shoule be Boolean') ,
    

    query('ratings')
    .optional()  ,


    query('subcategories')
    .optional() ,


    query('minQuantity')
    .optional()
    .isNumeric()
    .withMessage('Minimum Order Quantity should be numeric') ,

    query('businessType')
    .optional()
    .isMongoId()
    .withMessage('Business Type should be a valid id') ,


    query('state') 
    .optional()
    .isString()
    .withMessage('state should be a string') ,

    query('seller')
    .optional()
    .notEmpty()
    .withMessage('Seller Id should not be empty')
    .isMongoId()
    .withMessage('Seller Id should be a valid id') ,


    query('deliveryDays')
    .optional()
    .isNumeric()
    .withMessage('Delivery Day has to be a number'),


    (req , res ,next)=>validateRequest(req , res , next)
    
]

export const validateGetProductInfo=[
    param('slug')
    .exists()
    .withMessage('Slug is required') 
    .notEmpty()
    .withMessage('Slug should not be empty')
    .isString()
    .withMessage('Slug should be a string')
    .isSlug()
    .withMessage('Invalid Slug') ,

    (req , res , next)=>validateRequest(req , res , next)


]


export const validateGetProductDescription = [
    param('productId')
    .exists()
    .withMessage('Product Id is required') 
    .notEmpty()
    .withMessage('Product Id should not be empty')
    .isMongoId()
    .withMessage('Invalid Product Id') ,

    (req , res , next)=>validateRequest(req , res , next)
]
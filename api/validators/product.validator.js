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


    query('location') 
    .optional()
    .isString()
    .withMessage('Location should be a string') ,


    query('deliveryDays')
    .optional()
    .isNumeric()
    .withMessage('Delivery Day has to be a number'),


    (req , res ,next)=>validateRequest(req , res , next)
    
]
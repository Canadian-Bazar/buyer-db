import { check , param } from "express-validator";
import validateRequest from "../utils/validateRequest.js";




export const trackCategoryViewValidator=[
    param('categoryId')
     .exists()
     .withMessage('Category ID is required')
     .notEmpty()
     .withMessage('Category ID is required')
     .isMongoId()
     .withMessage('Invalid Mongo ID') ,

     (req , res , next)=> validateRequest(req , res , next)


]


export const trackCategorySearchValidator=[
    param('categoryId')
     .exists()
     .withMessage('Category ID is required')
     .notEmpty()
     .withMessage('Category ID is required')
     .isMongoId()
     .withMessage('Invalid Mongo ID') ,

     (req , res , next)=> validateRequest(req , res , next)


]


export const getPopularCategoryValidator=[
    (req,res , next)=>validateRequest(req, res , next)
]


export const getUserFrequentCategoriesValidator=[
    check('page')
    .optional()
    .isNumeric()
    .withMessage('Invalid Page') ,

    check('limit')
    .optional()
    .isNumeric()
    .withMessage('Invalid Limit') ,
    (req,res , next)=>validateRequest(req, res , next)

]
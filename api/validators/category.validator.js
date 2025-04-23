import { check , query , param } from "express-validator";
import  {paginationValidator} from './pagination.validator.js';
import validateRequest from "../utils/validateRequest.js";



export const validateGetAllCategories = [
    ...paginationValidator ,
    (req , res  , next)=>validateRequest(req , res, next)
]


export const validateGetSubCategories = [
    ...paginationValidator,
    query('parentCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Parent Category ID'),

    (req , res  , next)=>validateRequest(req , res, next)
]
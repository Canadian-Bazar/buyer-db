import { query } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import { paginationValidator } from "./pagination.validator.js";



export const getBlogsSlugsValidator = [
    ...paginationValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getProductsSlugsValidator = [
    ...paginationValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getServicesSlugsValidator = [
    ...paginationValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getCategoriesSlugsValidator = [
    query('slug')
    .optional()
    .isSlug()
    .withMessage('Invalid category ID') ,
    ...paginationValidator,
    (req , res , next)=>validateRequest(req , res , next)

    
];
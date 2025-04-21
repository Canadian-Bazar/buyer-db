import { check , query , param } from "express-validator";
import { likeTypes } from "../utils/likeTypes.js";
import validateRequest from './../utils/validateRequest.js';

export const validateLikeRequest=[
    query('productId')
    .exists()
    .withMessage('Product ID is required')
    .bail()
    .notEmpty()
    .withMessage('Product ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Product ID')
    .bail(),

    query('type')
    .exists()
    .withMessage('Type is required')
    .bail()
    .notEmpty()
    .withMessage('Type cannot be empty')
    .bail()
    .isIn(likeTypes)
    .withMessage('Invalid Type') ,

    (req , res , next)=>validateRequest(req , res, next)

]
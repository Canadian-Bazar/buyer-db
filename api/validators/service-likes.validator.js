import { check , query , param } from "express-validator";
import { likeTypes } from "../utils/likeTypes.js";
import validateRequest from './../utils/validateRequest.js';
import { paginationValidator } from "./pagination.validator.js";

export const validateServiceLikeDislikeRequest=[
    query('serviceId')
    .exists()
    .withMessage('Service ID is required')
    .bail()
    .notEmpty()
    .withMessage('Service ID cannot be empty')
    .bail()
    .isMongoId()
    .withMessage('Invalid Service ID')
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


export const validateGetLikedServicesRequest=[
    ...paginationValidator ,

    (req , res , next)=>validateRequest(req , res, next)
]
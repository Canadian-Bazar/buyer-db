import { check , param } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import { paginationValidator } from "./pagination.validator.js";


export const validateGetBlogs = [
    ...paginationValidator,
    check('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    check('latest')
        .optional()
        .isBoolean().withMessage('Latest must be a boolean')
        .toBoolean(),
    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetBlogBySlug = [
    param('slug')
        .isString()
        .withMessage('Slug must be a string')
        .isSlug()
        .withMessage('Slug must be a valid slug format'),
    (req, res, next) => validateRequest(req, res, next)
]

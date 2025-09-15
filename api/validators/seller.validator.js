import { check } from "express-validator"
import validateRequest from "../utils/validateRequest.js"
import mongoose from "mongoose"

export const validateGetSellerProfile = [
    check('sellerId')
        .isString()
        .withMessage('Seller ID must be a string')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Seller ID must be a valid MongoDB ObjectId')
            }
            return true
        }),
    
    (req, res, next) => validateRequest(req, res, next)
]

export const validateListSellers = [
    check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    check('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    check('search').optional().isString(),
    check('province').optional().isString(),
    check('city').optional().isString(),
    check('verified').optional().isBoolean().toBoolean(),
    check('category').optional().custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Category must be a valid MongoDB ObjectId');
        }
        return true;
    }),
    (req, res, next) => validateRequest(req, res, next)
]
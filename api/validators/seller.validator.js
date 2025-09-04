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
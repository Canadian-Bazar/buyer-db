import { check } from "express-validator";
import validateRequest from "../utils/validateRequest.js";




export const validateUpdateProfile=[
    check('fullName')
        .optional()
        .isString()
        .withMessage('Full name must be a string')
        .isLength({ min: 3 })
        .withMessage('Full name must be at least 3 characters long')
        .isAlphanumeric('en-US', { ignore: ' ' })
        .withMessage('Full name must contain only letters and numbers')
        .trim(),
    check('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 3 })
        .withMessage('City must be at least 3 characters long')
        .isAlphanumeric('en-US', { ignore: ' ' })
        .withMessage('City must contain only letters and numbers')
        .trim(),
    check('state')
        .optional()
        .isString()
        .withMessage('State must be a string')
        .isLength({ min: 3 })
        .withMessage('State must be at least 3 characters long')
        .isAlphanumeric('en-US', { ignore: ' ' })
        .withMessage('State must contain only letters and numbers')
        .trim(),

        (req , res , next)=>validateRequest(req , res , next)
]



export const validateGetProfile=[
    (req , res , next)=>validateRequest(req , res , next)
]
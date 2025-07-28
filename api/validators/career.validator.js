import { check , query } from "express-validator";
import validateRequest from "../utils/validateRequest.js";



export const validateCreateCareer = [
    check('fullName')
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2 }).withMessage('Full name must be at least 3 characters long'),
    check('email')
        .isEmail().withMessage('Invalid email format')
        .notEmpty().withMessage('Email is required'),
    check('phoneNumber')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone().withMessage('Invalid phone number format'),
    check('street')
        .notEmpty().withMessage('Street address is required'),
    check('city')
        .notEmpty().withMessage('City is required'),
    check('state')
        .notEmpty().withMessage('State is required'),   
    check('postalCode')
        .notEmpty().withMessage('Postal code is required')
        .isPostalCode('any').withMessage('Invalid postal code format'),
    check('category')
        .notEmpty().withMessage('Category is required')
        .isMongoId().withMessage('Invalid category ID format'),
    check('coverLetter')
        .optional()
        .isString().withMessage('Cover letter must be a string'),

    (req , res ,next)=>validateRequest(req , res , next)

];



export const validateVerifyEmail =[
 
    check('token')
        .notEmpty().withMessage('Token is required'),

        (req , res ,next)=>validateRequest(req , res , next)
    
]




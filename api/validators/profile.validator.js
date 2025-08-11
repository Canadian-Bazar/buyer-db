import { check } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import mongoose from "mongoose";




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
        .isLength({ min: 2 })
        .withMessage('State must be at least 3 characters long')
        .isAlphanumeric('en-US', { ignore: ' ' })
        .withMessage('State must contain only letters and numbers')
        .trim(),

    check('avatar')
        .optional()
        .isString()
        .withMessage('Avatar must be a string')
        .notEmpty()
        .withMessage('Avatar cannot be empty') ,

    




        (req , res , next)=>validateRequest(req , res , next)
]



export const validateGetProfile=[
    (req , res , next)=>validateRequest(req , res , next)
]


export const validateGetProfileOptions =[
    (req , res , next)=>validateRequest(req , res , next)
]


export const validateUpdateProfilePreference = [
    check('preferredLanguage')
        .optional()
        .custom((value) => {
            if (value === null || value === 'null' || value === '') {
                return true;
            }
            
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Preferred language must be a valid MongoDB ObjectId');
            }
            
            return true;
        }),
    
    check('preferredCurrency')
        .optional()
        .custom((value) => {
            if (value === null || value === 'null' || value === '') {
                return true;
            }
            
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Preferred currency must be a valid MongoDB ObjectId');
            }
            
            return true;
        }),
    
    check('paymentMethods')
        .optional()
        .custom((value) => {
            if (value === null || value === 'null' || value === '') {
                return true;
            }
            
            let methodsArray = value;
            
            if (typeof value === 'string') {
                try {
                    if (value.startsWith('[') && value.endsWith(']')) {
                        methodsArray = JSON.parse(value);
                    } 
                    else if (value.includes(',')) {
                        methodsArray = value.split(',').map(id => id.trim());
                    }
                    else {
                        methodsArray = [value];
                    }
                } catch (e) {
                    throw new Error('Invalid payment methods format');
                }
            }
            
            if (Array.isArray(methodsArray)) {
                const invalidIds = methodsArray.filter(id => !mongoose.Types.ObjectId.isValid(id));
                if (invalidIds.length > 0) {
                    throw new Error('Payment methods must contain valid MongoDB ObjectIds');
                }
            } else if (methodsArray !== null) {
                throw new Error('Payment methods must be an array');
            }
            
            if (methodsArray !== null) {
                return methodsArray;
            }
            
            return true;
        }),
    
    (req, res, next) => validateRequest(req, res, next)
];



export const validateGetProfilePreferences =[
    (req , res , next)=>validateRequest(req , res , next)
]
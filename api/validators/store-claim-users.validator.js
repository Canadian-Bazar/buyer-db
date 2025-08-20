import  { check  , query} from 'express-validator';
import { paginationValidator } from './pagination.validator.js';
import validateRequest from '../utils/validateRequest.js';
import mongoose from 'mongoose';





export const validateGetStores = [
    ...paginationValidator ,
    query('isClaimed')
        .optional()
        .isIn(['0', '1'])
        .withMessage('isClaimed must be 0 (unclaimed) or 1 (claimed)'),
    
    query('province')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Province must be between 1 and 50 characters'),
    
    query('city')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('City must be between 1 and 50 characters'),
    
    query('street')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Street must be between 1 and 100 characters'),
    
    query('category')
        .optional()
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Category must be a valid ObjectId');
            }
            return true;
        }),
    
    query('state')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('State must be between 1 and 50 characters'),
    
    (req, res, next) => validateRequest(req, res, next)



]


export const validateGetCategoryWiseClaimedData = [
    (req , res , next) => validateRequest(req , res, next)
]



export const validateGetRandomClaimedStores = [
    ...paginationValidator ,
    (req , res , next) => validateRequest(req , res, next)
]
  

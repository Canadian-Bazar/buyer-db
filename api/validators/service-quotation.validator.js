import { check , query , param } from "express-validator";
import validateRequest from "../utils/validateRequest.js";

export const validateCreateServiceQuotation = [

check('deadline')
  .optional({ checkFalsy: true, nullable: true }) 
  .isISO8601({ strict: true }) 
  .withMessage('Deadline must be a valid date in YYYY-MM-DD format')
  .custom(value => {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error('Deadline must be in YYYY-MM-DD format');
    }
    return true;
  }) ,
    check('minPrice')
        .exists()
        .withMessage('Min Price is required')
        .not()
        .isEmpty()
        .withMessage('Min Price cannot be empty')
        .isNumeric()
        .withMessage('Min Price must be a number'),
    check('maxPrice')
        .exists()
        .withMessage('Max Price is required')
        .not()
        .isEmpty()
        .withMessage('Max Price cannot be empty')
        .isNumeric()
        .withMessage('Max Price must be a number'),
    check('slug')
        .exists()
        .withMessage('Service Slug is required')
        .not()
        .isEmpty()  
        .withMessage('Service Slug cannot be empty')
        .isString()    
        .withMessage('Service Slug must be a string')
        .isSlug()
        .withMessage('Service Slug must be a valid slug'),

    check('attributes')
        .optional()
        .isArray()
        .withMessage('Attributes must be an array')
        .custom((value) => {
            for (const item of value) {
                if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                    throw new Error('Each attribute must be an object');
                }
                if (!item.hasOwnProperty('field') || !item.hasOwnProperty('value')) {
                    throw new Error('Each attribute object must contain field and value keys');
                }
                if (Object.keys(item).length !== 2) {
                    throw new Error('Each attribute object must only contain field and value keys');
                }
            }
            return true;
        }),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),

    check('state')
        .exists()
        .withMessage('State is required')
        .not()
        .isEmpty()
        .withMessage('State cannot be empty') ,
    check('pinCode')
        .exists()
        .withMessage('Pin Code is required')
        .not()
        .isEmpty()
        .withMessage('Pin Code cannot be empty')
        .isLength({ min: 6, max: 7 })
        .withMessage('Pin Code must be 6 digits long'),

    (req , res , next) => validateRequest(req , res , next)
]
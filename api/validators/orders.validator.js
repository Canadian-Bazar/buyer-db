import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'
import { paginationValidator } from './pagination.validator.js';

export const getOrderByIdValidator = [
  param('orderId')
    .exists()
    .withMessage('Order ID is required')
    .not()
    .isEmpty()
    .withMessage('Order ID cannot be empty')
    .isString()
    .withMessage('Order ID must be a string'),

  (req, res, next) => validateRequest(req, res, next)
]



export const getOrdersValidator=[
    ...paginationValidator ,
    check('status')
    .optional()
    .notEmpty()
    .withMessage('Status cannot be empty')
    .isString()
    .withMessage('Status should be a string') ,

    (req , res , next)=>validateRequest(req , res , next)
]
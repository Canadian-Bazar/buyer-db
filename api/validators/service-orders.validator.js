import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'
import { paginationValidator } from './pagination.validator.js';

export const getServiceOrderByIdValidator = [
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

export const getServiceOrdersValidator = [
    ...paginationValidator,
    query('status')
        .optional()
        .notEmpty()
        .withMessage('Status cannot be empty')
        .isIn([
            'pending',
            'confirmed', 
            'in_progress',
            'review_ready',
            'revision_requested',
            'completed',
            'delivered',
            'cancelled'
        ])
        .withMessage('Invalid service order status'),

    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search must be between 1 and 100 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const addServiceOrderFeedbackValidator = [
    param('orderId')
        .exists()
        .withMessage('Order ID is required')
        .not()
        .isEmpty()
        .withMessage('Order ID cannot be empty')
        .isString()
        .withMessage('Order ID must be a string'),

    check('rating')
        .exists()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    check('comment')
        .optional()
        .isString()
        .withMessage('Comment must be a string')
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters'),

    (req, res, next) => validateRequest(req, res, next)
]
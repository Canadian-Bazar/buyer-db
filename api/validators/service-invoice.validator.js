import { check } from 'express-validator';
import validateRequest from '../utils/validateRequest.js';

export const getServiceInvoiceDetailsValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Service invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Service invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid service invoice token format'),

  (req, res, next) => validateRequest(req, res, next),
];

export const acceptServiceInvoiceValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Service invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Service invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid service invoice token format'),

  (req, res, next) => validateRequest(req, res, next),
];

export const rejectServiceInvoiceValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Service invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Service invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid service invoice token format'),

  check('rejectionReason')
    .optional()
    .isString()
    .withMessage('Rejection reason must be a string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters'),

  (req, res, next) => validateRequest(req, res, next),
];
import { check } from 'express-validator';
import validateRequest from '../utils/validateRequest.js';

export const getInvoiceDetailsValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid invoice token format'),

  (req, res, next) => validateRequest(req, res, next),
];

export const acceptInvoiceValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid invoice token format'),

  (req, res, next) => validateRequest(req, res, next),
];

export const rejectInvoiceValidator = [
  check('invoiceToken')
    .exists()
    .withMessage('Invoice token is required')
    .not()
    .isEmpty()
    .withMessage('Invoice token cannot be empty')
    .isJWT()
    .withMessage('Invalid invoice token format'),

  check('rejectionReason')
    .optional()
    .isString()
    .withMessage('Rejection reason must be a string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters'),

  (req, res, next) => validateRequest(req, res, next),
];
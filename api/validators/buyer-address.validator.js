import { check, query, param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from "../utils/validateRequest.js";

export const validateGetAddresses = [
  ...paginationValidator,
  query('addressType')
    .optional()
    .isString().withMessage('Address type must be a string')
    .isIn(['Billing', 'Shipping']).withMessage('Address type must be either Billing or Shipping'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetAddress = [
  param('addressId')
    .exists().withMessage('Address ID is required')
    .notEmpty().withMessage('Address ID cannot be empty')
    .isString().withMessage('Address ID must be a string')
    .isMongoId().withMessage('Address ID must be a valid MongoDB ObjectId'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateCreateAddress = [
  check('addressType')
    .exists().withMessage('Address type is required')
    .notEmpty().withMessage('Address type cannot be empty')
    .isString().withMessage('Address type must be a string')
    .isIn(['Billing', 'Shipping']).withMessage('Address type must be either Billing or Shipping'),
  
  check('street')
    .exists().withMessage('Street is required')
    .notEmpty().withMessage('Street cannot be empty')
    .isString().withMessage('Street must be a string'),
  
  check('city')
    .exists().withMessage('City is required')
    .notEmpty().withMessage('City cannot be empty')
    .isString().withMessage('City must be a string'),
  
  check('state')
    .exists().withMessage('State is required')
    .notEmpty().withMessage('State cannot be empty')
    .isString().withMessage('State must be a string'),
  
  check('postalCode')
    .exists().withMessage('Postal code is required')
    .notEmpty().withMessage('Postal code cannot be empty')
    .isString().withMessage('Postal code must be a string'),
    // .matches(/^[A-Za-z0-9\s-]+$/).withMessage('Invalid postal code format'),
  
  check('country')
    .optional()
    .isString().withMessage('Country must be a string'),
  
  check('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateAddress = [
  param('addressId')
    .exists().withMessage('Address ID is required')
    .notEmpty().withMessage('Address ID cannot be empty')
    .isString().withMessage('Address ID must be a string')
    .isMongoId().withMessage('Address ID must be a valid MongoDB ObjectId'),
  
  check('addressType')
    .optional()
    .isString().withMessage('Address type must be a string')
    .isIn(['Billing', 'Shipping']).withMessage('Address type must be either Billing or Shipping'),
  
  check('street')
    .optional()
    .notEmpty().withMessage('Street cannot be empty')
    .isString().withMessage('Street must be a string'),
  
  check('city')
    .optional()
    .notEmpty().withMessage('City cannot be empty')
    .isString().withMessage('City must be a string'),
  
  check('state')
    .optional()
    .notEmpty().withMessage('State cannot be empty')
    .isString().withMessage('State must be a string'),
  
  check('postalCode')
    .optional()
    .notEmpty().withMessage('Postal code cannot be empty')
    .isString().withMessage('Postal code must be a string')
    .matches(/^[A-Za-z0-9\s-]+$/).withMessage('Invalid postal code format'),
  
  check('country')
    .optional()
    .isString().withMessage('Country must be a string'),
  
  check('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean value'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateDeleteAddress = [
  param('addressId')
    .exists().withMessage('Address ID is required')
    .notEmpty().withMessage('Address ID cannot be empty')
    .isString().withMessage('Address ID must be a string')
    .isMongoId().withMessage('Address ID must be a valid MongoDB ObjectId'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateSetDefaultAddress = [
  param('addressId')
    .exists().withMessage('Address ID is required')
    .notEmpty().withMessage('Address ID cannot be empty')
    .isString().withMessage('Address ID must be a string')
    .isMongoId().withMessage('Address ID must be a valid MongoDB ObjectId'),
  
  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetDefaultAddress = [
  query('addressType')
    .exists().withMessage('Address type is required')
    .notEmpty().withMessage('Address type cannot be empty')
    .isString().withMessage('Address type must be a string')
    .isIn(['Billing', 'Shipping']).withMessage('Address type must be either Billing or Shipping'),
  
  (req, res, next) => validateRequest(req, res, next)
]
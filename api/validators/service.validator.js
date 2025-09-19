import { check, query, param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from "../utils/validateRequest.js";

export const validateGetServices = [
  ...paginationValidator,
  // Free text search
  query('search')
    .optional()
    .isString()
    .withMessage('Search should be a string'),

  query('minPrice')
    .optional()
    .isNumeric()
    .withMessage('Min Price should be a number'),
  
  query('maxPrice')
    .optional()
    .isNumeric()
    .withMessage('Max Price should be a number'),
  
  query('city')
    .optional()
    .isString()
    .withMessage('City should be a string'),
  
  query('state')
    .optional()
    .isString()
    .withMessage('State should be a string'),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category should be a valid MongoDB ID'),
  
  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Is Verified should be Boolean'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive should be Boolean'),

  // Business type of seller
  query('businessType')
    .optional()
    .isMongoId()
    .withMessage('Business Type should be a valid MongoDB ID'),

  // Rating filters
  query('minRating')
    .optional()
    .isNumeric()
    .withMessage('minRating should be a number'),
  query('ratings')
    .optional()
    .isIn(['asc','desc'])
    .withMessage('ratings must be asc or desc'),

  // Allow multiple subcategories, mirrors product API
  query('subcategories')
    .optional()
    .custom((value) => {
      if (!value) return true;
      const ids = String(value).split(',').map((id) => id.trim()).filter(Boolean);
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (ids.every((id) => objectIdRegex.test(id))) return true;
      throw new Error('subcategories must be comma-separated Mongo IDs');
    }),

  // Optional sort parameter
  query('sortBy')
    .optional()
    .isIn(['priceAsc','priceDesc','newest','oldest'])
    .withMessage('sortBy must be one of priceAsc, priceDesc, newest, oldest'),
  
  (req, res, next) => validateRequest(req, res, next)
];

export const validateGetServiceDetails = [
  param('identifier')
    .exists()
    .withMessage('Service identifier is required')
    .notEmpty()
    .withMessage('Service identifier should not be empty')
    .custom((value) => {
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      
      if (mongoIdRegex.test(value) || slugRegex.test(value)) {
        return true;
      }
      throw new Error('Identifier must be a valid MongoDB ID or slug');
    }),
  
  (req, res, next) => validateRequest(req, res, next)
];
import { check } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateCNCQuote = [
  check('name')
    .exists()
    .withMessage('Name is required')
    .not()
    .isEmpty()
    .withMessage('Name cannot be empty')
    .isString()
    .withMessage('Name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  check('contact')
    .exists()
    .withMessage('Contact is required')
    .not()
    .isEmpty()
    .withMessage('Contact cannot be empty')
    .custom((value, { req }) => {
      // Check if it's a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      if (emailRegex.test(value)) {
        return true
      }
      
      // Normalize phone number by removing spaces, parentheses, dashes, and plus signs
      const normalizedPhone = value.replace(/[\s\(\)\-\+]/g, '')
      
      // Check if it's a valid 10-digit number (Canadian format)
      const phoneRegex = /^\d{10}$/
      
      if (!phoneRegex.test(normalizedPhone)) {
        throw new Error('Contact must be a valid email or Canadian phone number')
      }
      
      // Store the normalized phone number back in the request
      req.body.contact = normalizedPhone
      return true
    }),

  check('city')
    .exists()
    .withMessage('City is required')
    .not()
    .isEmpty()
    .withMessage('City cannot be empty')
    .isString()
    .withMessage('City must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  check('workType')
    .exists()
    .withMessage('Work type is required')
    .not()
    .isEmpty()
    .withMessage('Work type cannot be empty')
    .isString()
    .withMessage('Work type must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Work type must be between 2 and 100 characters'),

  check('budget')
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage('Budget must be a string')
    .isLength({ max: 50 })
    .withMessage('Budget cannot exceed 50 characters'),

  check('timeline')
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage('Timeline must be a string')
    .isLength({ max: 100 })
    .withMessage('Timeline cannot exceed 100 characters'),

  check('description')
    .optional({ checkFalsy: true, nullable: true })
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  (req, res, next) => validateRequest(req, res, next)
]
import { param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const getStatesByCountryValidator = [
  param('countryCode')
    .exists()
    .withMessage('Country code is required')
    .not()
    .isEmpty()
    .withMessage('Country code cannot be empty')
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase(),

  (req, res, next) => validateRequest(req, res, next)
]

export const getCitiesByStateValidator = [
  param('countryCode')
    .exists()
    .withMessage('Country code is required')
    .not()
    .isEmpty()
    .withMessage('Country code cannot be empty')
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase(),

  param('stateCode')
    .exists()
    .withMessage('State code is required')
    .not()
    .isEmpty()
    .withMessage('State code cannot be empty')
    .isLength({ min: 2, max: 3 })
    .withMessage('State code must be 2-3 characters')
    .isAlphanumeric()
    .withMessage('State code must contain only letters and numbers')
    .toUpperCase(),

  (req, res, next) => validateRequest(req, res, next)
]
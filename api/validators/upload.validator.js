import { query } from 'express-validator'

import validateRequest from '../utils/validateRequest.js'

export const uploadvalidator = [
  query('type').optional().not().isEmpty().withMessage('IS_EMPTY').trim(),
  (req, res, next) => validateRequest(req, res, next),
]

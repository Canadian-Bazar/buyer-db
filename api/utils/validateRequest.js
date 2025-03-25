import { validationResult } from 'express-validator'
import httpStatus from 'http-status'

const validateRequest = (req, res, next) => {
  try {
    validationResult(req).throw()
    next()
  } catch (err) {
    res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
      success: false,
      code: httpStatus.UNPROCESSABLE_ENTITY,
      ...err,
    })
  }
}

export default validateRequest

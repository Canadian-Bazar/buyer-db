import httpStatus from 'http-status'
import mongoose from 'mongoose'

import buildErrorObject from './buildErrorObject.js'

const isIDGood = (id = '') => {
  return new Promise((resolve, reject) => {
    const goodID = mongoose.Types.ObjectId.isValid(id)
    return goodID
      ? resolve(id)
      : reject(buildErrorObject(httpStatus.UNPROCESSABLE_ENTITY, 'INVALID_ID'))
  })
}

export default isIDGood

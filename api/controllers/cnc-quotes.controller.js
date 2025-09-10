import { matchedData } from 'express-validator'
import CNCQuote from '../models/cnc-quotes.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'

export const createCNCQuoteController = async (req, res) => {
  try {
    const validatedData = matchedData(req)

    const newQuote = await CNCQuote.create(validatedData)

    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, 'CNC Quote created successfully', newQuote)
    )
  } catch (err) {
    handleError(res, err)
  }
}
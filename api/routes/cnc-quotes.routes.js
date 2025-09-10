import express from 'express'
import trimRequest from 'trim-request'
import * as cncQuotesController from '../controllers/cnc-quotes.controller.js'
import * as cncQuotesValidator from '../validators/cnc-quotes.validator.js'

const router = express.Router()

router.use(trimRequest.all)

router.post(
  '/',
  cncQuotesValidator.validateCreateCNCQuote,
  cncQuotesController.createCNCQuoteController
)

export default router
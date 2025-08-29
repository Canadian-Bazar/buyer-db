import express from 'express'
import trimRequest from 'trim-request'
import * as serviceQuotationController from '../controllers/service-quotations.controller.js'
import * as serviceQuotationValidator from '../validators/service-quotation.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)

router.post(
    '/' ,
    requireAuth ,
    serviceQuotationValidator.validateCreateServiceQuotation ,
    serviceQuotationController.createServiceQuotationController ,
)

export default router 
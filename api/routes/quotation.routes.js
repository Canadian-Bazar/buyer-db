import express from 'express'
import trimRequest from 'trim-request'
import * as quotationController from '../controllers/quotations.controller.js'
import * as quotationVaidator from '../validators/quotation.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'




const router = express.Router()


router.use(trimRequest.all)


router.post(
    '/' ,
    requireAuth ,
    quotationVaidator.validateCreateQuotation ,
    quotationController.createQuotationController ,

)

export default router 

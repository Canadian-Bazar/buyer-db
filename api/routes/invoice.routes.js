import express from 'express'
import trimRequest from 'trim-request'
import * as buyerInvoiceControllers from '../controllers/invoice.controller.js'
import * as buyerInvoiceValidators from '../validators/invoice.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)

router.post(
  '/details',
  requireAuth ,
  buyerInvoiceValidators.getInvoiceDetailsValidator,
  buyerInvoiceControllers.getInvoiceDetails
)

router.put(
  '/accept',
  requireAuth,
  buyerInvoiceValidators.acceptInvoiceValidator,
  buyerInvoiceControllers.acceptInvoice
)

router.put(
  '/reject',
  requireAuth,
  buyerInvoiceValidators.rejectInvoiceValidator,
  buyerInvoiceControllers.rejectInvoice
)

export default router
import express from 'express'
import trimRequest from 'trim-request'
import * as serviceInvoiceControllers from '../controllers/service-invoice.controller.js'
import * as serviceInvoiceValidators from '../validators/service-invoice.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)

// Get service invoice details
router.post(
  '/',
  requireAuth,
  serviceInvoiceValidators.getServiceInvoiceDetailsValidator,
  serviceInvoiceControllers.getServiceInvoiceDetails
)



// Reject service invoice
router.put(
  '/reject',
  requireAuth,
  serviceInvoiceValidators.rejectServiceInvoiceValidator,
  serviceInvoiceControllers.rejectServiceInvoice
)

export default router
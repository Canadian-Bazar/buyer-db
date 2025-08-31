import express from 'express'
import trimRequest from 'trim-request'
import * as serviceInvoiceControllers from '../controllers/service-invoice.controller.js'
import * as serviceInvoiceValidators from '../validators/service-invoice.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)

// Get service invoice details
router.post(
  '/details',
  requireAuth,
  serviceInvoiceValidators.getServiceInvoiceDetailsValidator,
  serviceInvoiceControllers.getServiceInvoiceDetails
)

// Accept service invoice
router.put(
  '/accept',
  requireAuth,
  serviceInvoiceValidators.acceptServiceInvoiceValidator,
  serviceInvoiceControllers.acceptServiceInvoice
)

// Reject service invoice
router.put(
  '/reject',
  requireAuth,
  serviceInvoiceValidators.rejectServiceInvoiceValidator,
  serviceInvoiceControllers.rejectServiceInvoice
)

export default router
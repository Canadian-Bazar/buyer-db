import express from 'express'
import trimRequest from 'trim-request'
import * as serviceOrderControllers from '../controllers/service-orders.controller.js'
import * as serviceOrderValidators from '../validators/service-orders.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)
router.use(requireAuth)

// Get all service orders for buyer
router.get(
  '/',
  serviceOrderValidators.getServiceOrdersValidator,
  serviceOrderControllers.getServiceOrders
)

// Get service order by ID
router.get(
  '/:orderId',
  serviceOrderValidators.getServiceOrderByIdValidator,
  serviceOrderControllers.getServiceOrderById
)

// Add feedback to service order
router.post(
  '/:orderId/feedback',
  serviceOrderValidators.addServiceOrderFeedbackValidator,
  serviceOrderControllers.addServiceOrderFeedback
)

export default router
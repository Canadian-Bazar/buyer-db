import express from 'express'
import trimRequest from 'trim-request'
import * as orderControllers from '../controllers/orders.controller.js'
import * as orderValidators from '../validators/orders.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(trimRequest.all)
router.use(requireAuth)



router.get(
  '/:orderId',
  orderValidators.getOrderByIdValidator,
  orderControllers.getOrderById
)

router.get(
  '/',
  orderValidators.getOrdersValidator,
  orderControllers.getOrders
)


export default router
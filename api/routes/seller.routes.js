import express from 'express'
import * as sellerControllers from '../controllers/seller.controller.js'
import * as sellerValidator from '../validators/seller.validator.js'
import trimRequest from 'trim-request'

const router = express.Router()

router.get(
    '/:sellerId',
    trimRequest.all,
    sellerValidator.validateGetSellerProfile,
    sellerControllers.getSellerProfileController
)

router.get(
    '/',
    trimRequest.all,
    sellerValidator.validateListSellers,
    sellerControllers.listSellersController
)

export default router
import express from 'express'
import trimRequest from 'trim-request'
import * as buyerAddressController from '../controllers/buyer-address.controller.js'
import * as buyerAddressValidator from '../validators/buyer-address.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)


router.get(
    '/' , 
    buyerAddressValidator.validateGetAddresses , 
    buyerAddressController.getBuyerAddressesController
)


router.post(
    '/' , 
    buyerAddressValidator.validateCreateAddress , 
    buyerAddressController.addBuyerAddressController
)

router.put(
    '/:addressId' , 
    buyerAddressValidator.validateUpdateAddress , 
    buyerAddressController.updateBuyerAddressController
)

router.delete(
    '/:addressId' , 
    buyerAddressValidator.validateDeleteAddress , 
    buyerAddressController.deleteBuyerAddressController
)

router.get(
    '/:addressId' , 
    buyerAddressValidator.validateGetAddress , 
    buyerAddressController.getBuyerAddressByIdController
)

router.patch(
    '/:addressId' ,
    buyerAddressValidator.validateSetDefaultAddress ,
    buyerAddressController.setDefaultAddressController
)


export default router
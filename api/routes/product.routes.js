import express from 'express'
import * as productValidators from '../validators/product.validator.js'
import * as productControllers from '../controllers/product.controller.js'
import  trimRequest  from 'trim-request';
import { optionalAuth } from './../middlewares/optionalAuth.middleware.js';



const router = express.Router()

router.get(
    '/' ,
    trimRequest.all ,
    optionalAuth ,
    productValidators.validateGetProducts ,
    productControllers.getProductsController
)


export default router

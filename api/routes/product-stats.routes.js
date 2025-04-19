import express from 'express'
import * as productStatsController from '../controllers/product-stats.controller.js'
import * as productStatsValidator from '../validators/product-stats.validator.js'
import  trimRequest  from 'trim-request';


const router = express.Router()


router.get(
    '/popular' ,
    trimRequest.all ,
    productStatsValidator.validateGetPopularProducts ,
    productStatsController.getPopularProducts
)

router.get(
    '/best-seller' ,
    trimRequest.all ,
    productStatsValidator.validateGetPopularProducts ,
    productStatsController.getBestsellerProducts
)

router.put(
    '/track-view/:productId' ,
    trimRequest.all ,
    productStatsValidator.validateTrackProductView ,
    productStatsController.trackProductView
)


router.put(
    '/track-status' ,
    trimRequest.all ,
    productStatsValidator.validateTrackQuotationStatus ,
    productStatsController.trackQuotationStatus
)

router.get(
    '/new-arrivals' ,
    trimRequest.all ,
    productStatsValidator.validateGetNewArrivals ,
    productStatsController.getNewArrivalProducts
)

export default router
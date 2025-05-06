import express from 'express'
import * as productStatsController from '../controllers/product-stats.controller.js'
import * as productStatsValidator from '../validators/product-stats.validator.js'
import  trimRequest  from 'trim-request';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';


const router = express.Router()

router.use(trimRequest.all)
router.use(optionalAuth)


router.get(
    '/popular' ,
    productStatsValidator.validateGetPopularProducts ,
    productStatsController.getPopularProducts
)

router.get(
    '/best-seller' ,
    productStatsValidator.validateGetPopularProducts ,
    productStatsController.getBestsellerProducts
)

router.put(
    '/track-view/:productId' ,
    productStatsValidator.validateTrackProductView ,
    productStatsController.trackProductView
)


router.put(
    '/track-status' ,
    productStatsValidator.validateTrackQuotationStatus ,
    productStatsController.trackQuotationStatus
)

router.get(
    '/new-arrivals' ,
    productStatsValidator.validateGetNewArrivals ,
    productStatsController.getNewArrivalProducts
)

router.get(
    '/suggested' ,
    productStatsValidator.validateGetSuggestedProducts ,
    productStatsController.getSuggestedProducts
)

export default router
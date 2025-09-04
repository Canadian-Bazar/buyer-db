import * as serviceReviewController from '../controllers/service-reviews.controller.js';
import * as serviceReviewValidator from '../validators/service-reviews.validator.js';
import express from 'express'
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import trimRequest from 'trim-request';

const router = express.Router()

router.use(trimRequest.all)


router.get(
    '/' ,
    optionalAuth ,
    serviceReviewValidator.validateGetServiceReviews ,
    serviceReviewController.getServiceReviews

)

router.post(
    '/' ,
    requireAuth ,
    serviceReviewValidator.validateCreateOrUpdateServiceReview ,
    serviceReviewController.createOrUpdateServiceReview

)

router.delete(
    '/:reviewId' ,
    requireAuth ,
    serviceReviewValidator.validateDeleteServiceReview ,
    serviceReviewController.deleteServiceReview

)



export default router
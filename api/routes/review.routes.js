import * as reviewController from '../controllers/review.controller.js';
import * as reviewValidator from '../validators/review.validator.js';
import express from 'express'
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import trimRequest from 'trim-request';

const router = express.Router()

router.use(trimRequest.all)


router.get(
    '/' ,
    optionalAuth ,
    reviewValidator.validateGetProductReviews ,
    reviewController.getReviews

)

router.post(
    '/' ,
    requireAuth ,
    reviewValidator.validateCreateOrUpdateReview ,
    reviewController.createOrUpdateReview

)

router.delete(
    '/:reviewId' ,
    requireAuth ,
    reviewValidator.validateDeleteReview ,
    reviewController.deleteReview

)

router.patch(
    '/recalculate-ratings/:productId?' ,
    requireAuth ,
    reviewValidator.validateRecalculateRatings ,
    reviewController.recalculateProductRatings
)



export default router
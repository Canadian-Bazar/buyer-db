import express from 'express' ;
import * as serviceLikesController from '../controllers/service-likes.controller.js'
import * as serviceLikesValidator from '../validators/service-likes.validator.js'
import trimRequest from 'trim-request';
import { requireAuth } from '../middlewares/auth.middleware.js';


const router = express.Router() ;

router.use(trimRequest.all) ;
router.use(requireAuth) ;

router.get(
    '/' ,
    requireAuth ,
    serviceLikesValidator.validateGetLikedServicesRequest ,
    serviceLikesController.getLikedServicesController


)


router.put(
    '/' ,
    serviceLikesValidator.validateServiceLikeDislikeRequest ,
    serviceLikesController.handleServiceLikeDislikeController


)

export default router
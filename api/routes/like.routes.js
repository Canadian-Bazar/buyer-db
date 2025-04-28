import express from 'express' ;
import * as likesController from '../controllers/likes.controller.js'
import * as likesValidator from '../validators/likes.validator.js'
import trimRequest from 'trim-request';
import { requireAuth } from '../middlewares/auth.middleware.js';


const router = express.Router() ;

router.use(trimRequest.all) ;
router.use(requireAuth) ;

router.get(
    '/' ,
    requireAuth ,
    likesValidator.validateGetLikedProductsRequest ,
    likesController.getLikedProductsController


)


router.put(
    '/' ,
    likesValidator.validateLikeDislikeRequest ,
    likesController.handleLikeDislikeController


)

export default router
import express from 'express' ;
import * as likeDislikeController from '../controllers/likes.controller.js'
import * as likeDislikeValidator from '../validators/likes.validator.js'
import trimRequest from 'trim-request';
import { requireAuth } from '../middlewares/auth.middleware.js';


const router = express.Router() ;

router.use(trimRequest.all) ;
router.use(requireAuth) ;


router.put(
    '/' ,
    likeDislikeValidator.validateLikeRequest ,
    likeDislikeController.handleLikeDislikeController


)

export default router
import express from 'express'
import * as careerController from '../controllers/career.controller.js'
import * as careerValidator from '../validators/career.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import trimRequest from 'trim-request';
import multer from 'multer';



const router = express.Router()

const upload = multer({
  dest: 'upload/', 
})




router.use(trimRequest.all)
router.use(requireAuth)

router.post(
    '/' ,
    upload.array('files', 1),
    careerValidator.validateCreateCareer ,
    careerController.createCareer
)

router.get(
    '/'  ,
    careerController.getDataToPrefill
)

router.put(
    '/',
    careerValidator.validateVerifyEmail ,
    careerController.verifyEmail
)

export default router
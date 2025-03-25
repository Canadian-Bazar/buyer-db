import express from 'express'
import multer from 'multer'

import * as uploadController from '../controllers/upload.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import * as uploadValidator from '../validators/upload.validator.js'

const router = express.Router()

const upload = multer({
  dest: 'upload/', 
})

router.post(
  '/',
  upload.array('files', 10),
  requireAuth,
  uploadValidator.uploadvalidator,
  uploadController.uploadController
)

export default router

import express from 'express'
import multer from 'multer'
import * as profileControllers from '../controllers/profile.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import * as profileValidator from '../validators/profile.validator.js'
import trimRequest from 'trim-request'

const router = express.Router()



const upload = multer({
  dest: 'uploads/', 
})


router.get(
    '/' ,
    requireAuth ,
    profileValidator.validateGetProfile ,
    profileControllers.getProfileController
)



router.post(
    '/' ,
    trimRequest.all ,
    requireAuth ,
    upload.array('files' , 1) ,
    profileValidator.validateUpdateProfile ,
    profileControllers.updateProfileController
)


router.get(
  '/preferences' ,
  profileValidator.validateGetProfileOptions ,
  profileControllers.getProfileOptions

)

router.put(
  '/preferences' ,

  requireAuth ,
  profileValidator.validateUpdateProfilePreference ,
  profileControllers.updateProfilePreferencesController
)


export default router

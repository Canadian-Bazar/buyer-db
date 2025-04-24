import express from 'express'
import trimRequest from 'trim-request'

import * as authControllers from '../controllers/auth.controller.js'
import * as authValidators from '../validators/auth.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
const router = express.Router()

router.use(trimRequest.all)


router.post(
  '/signup',
  authValidators.signupValidator,
  authControllers.signupController,
)

router.post(
  '/login' ,
  authValidators.loginValidator ,
  authControllers.loginController
)

router.delete(
  '/logout' , 
  authControllers.logoutController
)


router.post(
  '/send-otp' ,
  authValidators.sendOtpvalidator ,
  authControllers.sendOtpController
)

// router.post(
//   '/forgot-password-token',
//   authValidators.generateForgotPasswordTokenValidator,
//   authControllers.generateForgotPasswordTokenController
// )

router.post(
  '/reset-password' ,
  authValidators.resetPasswordValidator ,
  authControllers.resetPasswordController
)


router.post(
  '/verify-otp' ,
  authValidators.verifyOtpValidator , 
  authControllers.verifyOtpController
)



router.post(
  '/forgot-password-otp' ,
  authValidators.validateGetPasswordOTP ,
  authControllers.getForgotPasswordOtpController
)

router.post(
  '/forgot-password-token' ,
  authValidators.validateGetForgotPasswordToken ,
  authControllers.getForgotPasswordToken
)

router.post(
  '/reset-password' ,
  authValidators.resetPasswordValidator,
  authControllers.resetPasswordController
)


router.get(
  '/verify-tokens' ,
  authValidators.verifyTokensValidator ,
  authControllers.verifyTokensController
)


router.post(
  '/email-verification-link' ,
  requireAuth ,
  authValidators.validateSendEmailVerificationOTP ,
  authControllers.sendEmailVerificationLink
)


router.post(
  '/verify-email' ,
  authValidators.validateVerifyEmail ,
  authControllers.verifyEmail
)




export default router

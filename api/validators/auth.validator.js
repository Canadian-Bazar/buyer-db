import { check } from 'express-validator'

import validateRequest from '../utils/validateRequest.js'
import validator from 'validator';


export const signupValidator = [
  check('fullName')
    .exists()
    .withMessage('Full Name Is Required')
    .not()
    .isEmpty()
    .withMessage('Full Name Cannot Be Empty')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('Name must contain only letters and spaces') ,
    

  // check('email')
  //   .exists()
  //   .withMessage('Email Is Required')
  //   .not()
  //   .isEmpty()
  //   .withMessage('Email Cannot Be Empty')
  //   .isEmail()
  //   .withMessage('Email is invalid'),

  check('phoneNumber')
    .exists()
    .withMessage('Phone Number is Required')
    .not()
    .isEmpty()
    .withMessage('Phone Number Be Empty') 
    .isMobilePhone()
    .withMessage('Phone Number is Invalid'),

  check('password')
    .isStrongPassword()
    .withMessage(
      'Password must conntain one digit , one special character , one uppercase letter with minimum length 8',
    ),

    check('confirmPassword')
    .isStrongPassword()
    .withMessage(
      'Password must conntain one digit , one special character , one uppercase letter with minimum length 8',
    ),

    check('city')
    .exists()
    .withMessage('City is required')
    .not()
    .isEmpty()
    .withMessage('City cannot be empty') ,


    check('state')
    .exists()
    .withMessage('State is required')
    .not()
    .isEmpty()
    .withMessage('State cannot be empty') ,
    check('otp')

    .exists()
    .withMessage('OTP is required')
    .not()
    .isEmpty()
    .withMessage('OTP cannot be empty')
    .isLength({ min:  6, max: 6 })
    .withMessage('Invalid OTP')
    .isNumeric()
    .withMessage('Invalid OTP'),

  (req, res, next) => validateRequest(req, res, next),
]

export const loginValidator = [
  check('uid')
  .exists().withMessage('Login Credentials Missing')
  .notEmpty().withMessage('Credentials Cannot Be Empty')
  .custom((value) => {
    const isNanoId = /^[0-9]{12}$/.test(value);
    const isEmail = validator.isEmail(value);
    const isCanadianPhone = validator.isMobilePhone(value, 'en-CA'); // built-in

    if (isNanoId || isEmail || isCanadianPhone) {
      return true;
    }

    throw new Error('Invalid credentials');
  }),

  check('password')
    .exists()
    .withMessage('Password is required')
    .not()
    .isEmpty()
    .withMessage('Password cannot be empty'),

  (req, res, next) => validateRequest(req, res, next)
]

export const sendOtpvalidator = [
  check('phoneNumber')
    .exists()
    .withMessage('Phone Number is required')
    .not()
    .isEmpty()
    .withMessage('Phone Number cannot be empty'),

  (req, res, next) => validateRequest(req, res, next)
]

export const verifyOtpValidator = [
  check('email')
    .exists()
    .withMessage('Email is required')
    .not()
    .isEmpty()
    .withMessage('Email cannot be empty'),

  check('otp')
    .exists()
    .withMessage('OTP is Required')
    .not()
    .isEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 4 })
    .withMessage('Invalid OTP')
    .isNumeric()
    .withMessage('Invalid OTP'),

  (req, res, next) => validateRequest(req, res, next)
]

export const generateForgotPasswordTokenValidator = [
  check('email')
    .exists()
    .withMessage('Email is required')
    .not()
    .isEmpty()
    .withMessage('Email cannot be empty'),

  (req, res, next) => validateRequest(req, res, next)
]

export const resetPasswordValidator = [
  check('forgotToken')
    .exists()
    .withMessage('Forgot Password Token Is Required')
    .not()
    .isEmpty()
    .withMessage('Missing Token'),

  check('newPassword')
    .exists()
    .withMessage('Password is required')
    .not()
    .isEmpty()
    .withMessage('Password cannot be empty')
    .isStrongPassword()
    .withMessage(
      'Password must conntain one digit , one special character , one uppercase letter with minimum length 8',
    ),

  (req, res, next) => validateRequest(req, res, next)
]


export const verifyTokensValidator =[
  (req , res , next)=>validateRequest(req , res , next)
]

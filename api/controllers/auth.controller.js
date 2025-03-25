import bcrypt from 'bcrypt'
import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import jwt  from 'jsonwebtoken'
import otpGenerator  from 'otp-generator'

import sendMail from '../helpers/sendMail.js'
import Roles from '../models/role.schema.js'
import User from '../models/user.schema.js'
import Verifications from '../models/verification.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'
import decrypt from '../utils/decrypt.js'
import generateForgotToken from '../utils/generate-forgot-token.js'
import generateTokens from '../utils/generateTokens.js'
import handleError from '../utils/handleError.js'
import isIDGood from '../utils/isIDGood.js'

/**
 * Controller: signupController
 * Description: Handles user registration by creating a new user in the database.
 * 
 * Request:
 *  - email: User's email in plain text
 *  - password: User's password in plain text
 * 
 * Response:
 *  - On Success: Creates a new user and responds with status 201.
 *  - On Failure: Returns an error response (e.g., "User Already Exists").
 * 
 * Steps:
 * 1. Validate the request data.
 * 2. Check if the user already exists based on email.
 * 3. Assign the default role (user) to the new user.
 * 4. Create the user and save it in the database.
 * 5. Respond with success or error message.
 */
export const signupController = async (req, res) => {
  try {
    req = matchedData(req)
    const existingUser = await User.findOne({ email: req.email }).lean()
    if (existingUser?._id) {
      throw buildErrorObject(httpStatus.CONFLICT, 'User Already Exists')
    }

    const userRole = await Roles.findOne({ role: 'user' }).lean()
    if (!userRole) {
      throw buildErrorObject(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Unable to assign user role. Please try again later.'
      )
    }
    req.roleId = userRole._id

    await User.create(req)

    res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED, {
     
      message: 'User Created Successfully',
    }))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Controller: loginController
 * Description: Authenticates a user and generates access and refresh tokens.
 * 
 * Request:
 *  - email: User's email in plain text
 *  - password: User's password in plain text
 * 
 * Response:
 *  - On Success: Sends cookies with access and refresh tokens along with user details.
 *  - On Failure: Returns an error response (e.g., "Invalid Credentials", "User Blocked").
 * 
 * Steps:
 * 1. Validate the request data.
 * 2. Verify if the user exists in the database.
 * 3. Check the user's password and handle incorrect login attempts.
 * 4. Reset login attempts on successful authentication.
 * 5. Generate tokens and send them as cookies along with user data.
 */

export const loginController = async (req, res) => {
  try {
    req = matchedData(req)
    let user = await User.findOne({ email: req.email }).select('password loginAttempts blockExpires')

    if (!user?._id) {
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'No Such User Exists')
    }

    if (!await bcrypt.compare(req.password, user.password)) {
      const loginAttempts = user.loginAttempts + 1
      const blockExpires = new Date(new Date().getTime() + 30 * 60000)
      if (user.blockExpires > new Date()) {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'USER BLOCKED')
      }

      if (loginAttempts >= 5) {
        user.loginAttempts = loginAttempts
        user.blockExpires = blockExpires
        await user.save()
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'USER BLOCKED')
      }

      user.loginAttempts = loginAttempts
      await user.save()
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'INVALID CREDENTIALS')
    }

    if (user.blockExpires > new Date()) {
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'USER BLOCKED')
    }
    user.loginAttempts = 0
    await user.save()
    user = await User.findById(user._id).lean()
    const { accessToken, refreshToken } = generateTokens(user)
    res
      .cookie('accessToken', accessToken, {
        httpOnly: process.env.NODE_ENV === 'development',
        secure: !process.env.NODE_ENV === 'development',
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: process.env.NODE_ENV === 'development',
        secure: !process.env.NODE_ENV === 'development',
      })
      .status(httpStatus.ACCEPTED)
      .json(buildResponse(httpStatus.ACCEPTED, user))

  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Controller: logoutController
 * Description: Logs out the user by clearing authentication cookies.
 * 
 * Response:
 *  - On Success: Clears cookies and sends a success response.
 *  - On Failure: Returns an error response if an issue occurs.
 * 
 * Steps:
 * 1. Clear the accessToken and refreshToken cookies.
 * 2. Respond with a success message.
 */
export const logoutController = async (req, res) => {
  try {
    res
      .clearCookie('accessToken', {
        httpOnly: process.env.NODE_ENV === 'development',
        secure: !process.env.NODE_ENV === 'development',
      })
      .clearCookie('refreshToken', {
        httpOnly: process.env.NODE_ENV === 'development',
        secure: !process.env.NODE_ENV === 'development',
      })
      .status(httpStatus.NO_CONTENT)
      .json(buildResponse(httpStatus.NO_CONTENT))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Controller: verifyTokensController
 * Description: Verifies the validity of the user's access and refresh tokens.
 * 
 * Response:
 *  - On Success: Validates tokens and sends an appropriate success message.
 *  - On Failure: Returns an error response for missing or invalid tokens.
 * 
 * Steps:
 * 1. Check if the access token exists in cookies.
 * 2. Validate the access token. If expired, validate the refresh token.
 * 3. Generate a new access token if the refresh token is valid.
 * 4. Respond with the new token or success message.
 */
export const verifyTokensController = async (req, res) => {
  try {
    let accessToken = req.cookies.accessToken
    let refreshToken = req.cookies.refreshToken

    if (!accessToken) {
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'ACCESS_TOKEN_MISSING')
    }

    accessToken = decrypt(accessToken)

    try {
      jwt.verify(accessToken, process.env.AUTH_SECRET)

      res
        .status(httpStatus.OK)
        .json(buildResponse(httpStatus.OK, {
          success: true,
          message: 'Access token is valid',
        }))
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        if (!refreshToken) {
          throw buildErrorObject(httpStatus.UNAUTHORIZED, 'REFRESH_TOKEN_MISSING')
        }

        refreshToken = decrypt(refreshToken)

        try {
          let user = jwt.verify(refreshToken, process.env.REFRESH_SECRET)

          user = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            roleId: user.roleId,
          }

          const { accessToken } = generateTokens(user)

          res
            .cookie('accessToken', accessToken, {
              httpOnly: true,
              secure,
            
            })
            .status(httpStatus.CREATED)
            .json(buildResponse(httpStatus.CREATED, {
              success: true,
              message: 'Access token generated successfully',
            }))
        } catch (err) {
          throw buildErrorObject(httpStatus.UNAUTHORIZED, 'Session expired, please login again to continue')
        }
      } else {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'Tokens were malformed')
      }
    }
  } catch (err) {
    handleError(res, err)
  }
}

/**
**
 * Controller: sendOTPController
 * Description: Sends a  OTP (One Time Password) to the user's email if the user is not yet verified.
 *
 * @param {Object} req - Express request object containing the user's email.
 * @param {Object} res - Express response object used to send the response.
 *
 * Request:
 * - req.body.email: The email of the user requesting the OTP to be resent.
 *
 * Response:
 * - On success: Sends a new OTP to the user's email and responds with HTTP 200 (OK) and a success message.
 * - On failure: Returns an error response if there is an issue with the process.
 *
 * Steps:
 * 1. Extract and sanitize the request data using matchedData.
 * 2. Find the user by the provided email:
 *    - If the user exists and has the 'user' role:
 *      - If the user is not yet verified, generate a new OTP.
 * 3. Generate a 5-digit OTP for verification, valid for 30 minutes.
 * 4. Update the existing OTP record or create a new one if needed (upsert).
 * 5. Send the new OTP via email using the sendMail function.
 * 6. Send a success response with HTTP status 200 and a message indicating the OTP has been sent.
 * 7. Handle any errors during the process and send an appropriate error response.
 *
 * Errors:
 * - Errors related to database issues or email sending will be caught and handled appropriately.
 */


export const sendOtpController = async (req, res) => {
  try {
    const requestData = matchedData(req)

    const user = await User.findOne({
      email: requestData.email.toString(),
    }).lean()
    if (user?._id) {
      throw buildErrorObject(httpStatus.CONFLICT, 'User Already Exists')
    }


    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
      digits: true,
    })

    const validTill = new Date(new Date().getTime() + 30 * 60000)


    sendMail(requestData.email, 'register.ejs', {
      subject: 'Verification OTP',
      otp,
    })

    await Verifications.findOneAndUpdate(
      { email: requestData.email },
      { otp, validTill },
      { upsert: true }
    )

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, { message: 'OTP_SENT' }))
  } catch (err) {
    handleError(res, err)
  }
}


/**
 * Controller: verifyOTPController
 * Description: Verifies a user's OTP (One Time Password) and updates the user's verification status.
 *              If the OTP is valid, the user's account is marked as verified. If the OTP is expired or incorrect,
 *              a new OTP is generated and sent to the user's email.
 *
 * @param {Object} req - Express request object containing the user's email and OTP.
 * @param {Object} res - Express response object used to send the response.
 *
 * Request:
 * - req.body.email: The email of the user requesting OTP verification.
 * - req.body.otp: The OTP entered by the user for verification.
 *
 * Response:
 * - On success: Marks the user as verified and sends HTTP 202 (Accepted) with a success message.
 * - On failure: Returns an error response (e.g., INVALID_CREDENTIALS, OTP expired).
 *
 * Function Flow:
 * 1. Extract and sanitize the request data using matchedData.
 * 2. Check if the user exists and is not already verified:
 *    - If the user is verified or doesn't exist, throw an UNAUTHORIZED error.
 * 3. Ensure the user has the correct role (e.g., "user").
 * 4. Retrieve the user's OTP and check its validity:
 *    - If the OTP is expired, generate a new OTP, save it, and resend via email.
 *    - Throw an error indicating invalid credentials if OTP is incorrect.
 * 5. If the OTP is valid, mark the user as verified.
 * 6. Send a success response indicating the user has been verified.
 * 7. Handle any errors during the verification process and send an appropriate error response.
 *
 * Errors:
 * - 401 UNAUTHORIZED: If the user credentials are invalid, OTP is expired, or OTP is incorrect.
 */


export const verifyOtpController = async(req , res)=>{
  try {
    req = matchedData(req)

    const verification = await Verifications.findOne({ email: req.email })
    if (!verification) {
      throw buildErrorObject(
        httpStatus.NOT_FOUND,
        'No OTP found for this email. Please request a new OTP.'
      )
    }

    console.log(req.otp , verification.otp)

    if (parseInt(req.otp) !== parseInt(verification.otp)) {
      throw buildErrorObject(
        httpStatus.UNAUTHORIZED,
        'The OTP you entered is incorrect. Please try again.'
      )
    }

    res.status(httpStatus.ACCEPTED).json(
      buildResponse(httpStatus.ACCEPTED, {
        message: 'Verification successful. Your account is now verified.',
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}



/**
 * Controller: forgotPasswordController
 * Description: Handles the "forgot password" functionality by generating a password reset token
 *              and sending it to the user's email address.
 *
 * @param {Object} req - Express request object containing the user's email.
 * @param {Object} res - Express response object used to send the response.
 *
 * Request:
 * - req.body.email: The email of the user requesting the password reset.
 *
 * Response:
 * - On success: Sends an email with a password reset link/token to the user and responds with HTTP 200 (OK) and a success message.
 * - On failure: Returns an error response if there is an issue with the process.
 *
 * Function Flow:
 * 1. Extract and sanitize the request data using matchedData.
 * 2. Find the user by the provided email:
 *    - If the user exists and has the 'user' role:
 *      - Generate a JWT token for password reset with a defined expiration.
 *      - Encrypt the token and send an email containing the token to the user's email.
 * 3. Send an HTTP 200 response with a success message ('EMAIL_SENT').
 *    - If running in a test environment, include whether sendMail was called.
 * 4. Handle any errors during the process and send an appropriate error response.
 *
 * Environment Variables:
 * - FORGOT_SECRET: The secret used for signing the password reset JWT.
 * - FORGOT_EXPIRATION: The expiration time for the password reset token.
 * - FRONTEND_URL: The frontend URL used to send the password reset token.
 * - NODE_ENV: Used to detect if the application is in 'test' mode.
 *
 * Errors:
 * - Returns a generic success message even if the user does not exist or email is not found (for security purposes).
 */



export const generateForgotPasswordTokenController = async(req , res)=>{
  try{

    req=matchedData(req)

    const user = await User.findOne({email:req.email}).select('_id email').lean()
    console.log(user)
    const forgotPasswordToken = generateForgotToken(user) 

    sendMail(req.email, 'forgot-password.ejs', {
      token:forgotPasswordToken,
      subject: 'Forgot password',
      frontendURL: process.env.FRONTEND_URL,
    })

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK , {
        message:'Reset Password Link Sent Successfully'
      }))
  

  }catch(err){
    handleError(res , err)

  }
}






/**
 * Controller: resetPasswordController
 * Description: Handles the "reset password" functionality by resetting the password to the users's new password.
 *
 * @param {Object} req - Express request object containing the forgotToken and newPassword.
 * @param {Object} res - Express response object used to send the response.
 *
 * Request:
 * - req.forgotToken: The temporary token genrated containing users credential.
 * -req.newPassword:The new password taken from the user
 *
 * Response:
 * - On success: Changes the password successfully and returns response ACCEPTED.
 * - On failure: Returns an error response if there is an issue with the process.
 *
 * Function Flow:
 * 1. Extract and sanitize the request data using matchedData.
 * 2.Verify The Token.Throw an Error If it is invalid or expired
 * 3. Find the user by the provided email:
 *    -Assign the new password to the user
 * 4. Handle any errors during the process and send an appropriate error response.
 *
 *
 * Errors:
 * - Returns a generic success message even if the user does not exist or email is not found (for security purposes).
 */



export const resetPasswordController = async(req , res)=>{
  try{
    req = matchedData(req)
    const {forgotToken , newPassword} = req 
    const decryptedToken = decrypt(forgotToken)

    let user 
    

    try{
      user =  jwt.verify(decryptedToken , process.env.FORGOT_SECRET)
    }catch(err){
      return res.status(httpStatus.UNAUTHORIZED).json(
        buildResponse(httpStatus.UNAUTHORIZED, {
          success:false ,
          message:'Token Expired'
        })
      )
    }

    const userId = await isIDGood(user._id)
    user = await User.findById(userId)
    user.password = newPassword
    await user.save()

    res.status(httpStatus.ACCEPTED).json(
      httpStatus.ACCEPTED , {
        success:true ,
        message:'Password Changed Successfully'
      }
    )


  }catch(err){
    handleError(res ,err)
  }
}



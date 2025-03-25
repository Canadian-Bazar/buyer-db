
import httpStatus from 'http-status'
import jwt from 'jsonwebtoken'

import buildErrorObject from '../utils/buildErrorObject.js'
import decrypt from '../utils/decrypt.js'


/**
  Middleware:requireAuth

  Description:This middleware authenticates user on the bases of accesstoken they have received.If the token is missing
  or expired it  throws un-authorized error.


  Steps:
  1.Extract 'accessToken' from req
  2.If token is missing throw unauthorized error.
  3.Decrypt the token.
  4.Verify the token.If expired throw Expired Token Error if Invalid Throw Invalid Token Error.
  5.If verified assign the decoded token to req.user and proceed
 *
*/

export const requireAuth =(req , res , next)=>{
  try{
    let token = req.cookies.accessToken
    if(!token){
      throw buildErrorObject(httpStatus.UNAUTHORIZED , 'UNAUTHORIZED')
    }

    token = decrypt(token) 
    jwt.verify(token , process.env.AUTH_SECRET , (err , decoded)=>{
      if(err){
        if(err.name==='TokenExpiredError'){
          throw buildErrorObject(httpStatus.UNAUTHORIZED , 'TOKEN EXPIRED')
        }else{
          throw buildErrorObject(httpStatus.UNAUTHORIZED , 'INVALID TOKEN')
        }
      }else{
        req.user = decoded
        next()
      }
    })

  }catch(err){
    throw buildErrorObject(httpStatus.INTERNAL_SERVER_ERROR , 'INTERNAL SERVER ERROR')

  }
}
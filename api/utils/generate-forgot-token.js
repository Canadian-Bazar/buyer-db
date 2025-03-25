import jwt from 'jsonwebtoken'

import encrypt from './encrypt.js'

const generateForgotToken = (user = {}) => {
  return encrypt(
    jwt.sign(user, process.env.FORGOT_SECRET, {
      expiresIn: process.env.FORGOT_EXPIRATION,
    })
  )
}

export default generateForgotToken
global.generateForgotToken = generateForgotToken

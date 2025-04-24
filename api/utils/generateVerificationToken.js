import jwt from 'jsonwebtoken'

import encrypt from './encrypt.js'

const generateVerificationToken = (user = {}) => {

  return encrypt(
    jwt.sign(user, process.env.VERIFICATION_SECRET, {
      expiresIn: process.env.VERIFICATION_EXPIRATION,
    })
  )
}

export default generateVerificationToken
global.generateVerificationToken = generateVerificationToken

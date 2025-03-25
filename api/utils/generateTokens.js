import jwt from 'jsonwebtoken'

import encrypt from './encrypt.js'

const generateAuthToken = (user = {}) => {
  return encrypt(
    jwt.sign(user, process.env.AUTH_SECRET, {
      expiresIn: process.env.AUTH_EXPIRATION,
    }),
  )
}

const generateRefreshToken = (user = {}) => {
  return encrypt(
    jwt.sign(user, process.env.REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_EXPIRATION,
    }),
  )
}

const generateTokens = (user = {}) => {
  const accessToken = generateAuthToken(user)
  const refreshToken = generateRefreshToken(user)

  return { accessToken, refreshToken }
}

export default generateTokens
global.generateTokens = generateTokens

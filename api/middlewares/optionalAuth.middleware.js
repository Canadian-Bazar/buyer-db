

import httpStatus from 'http-status'
import jwt from 'jsonwebtoken'

import buildErrorObject from '../utils/buildErrorObject.js'
import decrypt from '../utils/decrypt.js'










export const optionalAuth = (req, res, next) => {
    try {
      let token = req.cookies.buyerAccessToken;
      if (!token) {
        // No token = guest user
        req.user = null;
        return next();
      }
  
      token = decrypt(token);
  
      jwt.verify(token, process.env.AUTH_SECRET, (err, decoded) => {
        if (err) {
          // Invalid or expired token = treat as guest
          req.user = null;
          return next();
        } else {
          req.user = decoded; // attach user info to request
          return next();
        }
      });
    } catch (err) {
      // If something unexpected happens, treat as guest
      req.user = null;
      return next();
    }
  };
  
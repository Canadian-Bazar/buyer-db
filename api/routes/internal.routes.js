import express from 'express'
import trimRequest from 'trim-request'
import httpStatus from 'http-status'

import buildErrorObject from '../utils/buildErrorObject.js'
import { createBuyerInternalController } from '../controllers/internal.controller.js'

const router = express.Router()

router.use(trimRequest.all)

// Simple shared-secret guard for internal calls
router.use((req, res, next) => {
  const secretHeader = req.headers['x-internal-secret']
  if (!secretHeader || secretHeader !== process.env.INTERNAL_SHARED_SECRET) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json(buildErrorObject(httpStatus.UNAUTHORIZED, 'UNAUTHORIZED_INTERNAL_REQUEST'))
  }
  return next()
})

router.post('/buyer/create', createBuyerInternalController)

export default router



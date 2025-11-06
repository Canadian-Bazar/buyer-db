import express from 'express'
import trimRequest from 'trim-request'

import * as slugController from '../controllers/slug.controller.js'
import * as slugValidator from '../validators/slugs.validator.js'

const router = express.Router()

router.use(trimRequest.all)

router.get(
  '/blogs',
  slugValidator.getBlogsSlugsValidator,
  slugController.getBlogsSlugs
)

router.get(
  '/products',
  slugValidator.getProductsSlugsValidator,
  slugController.getProductsSlugs
)

router.get(
  '/services',
  slugValidator.getServicesSlugsValidator,
  slugController.getServicesSlugs
)

router.get(
  '/categories',
  slugValidator.getCategoriesSlugsValidator,
  slugController.getCategoriesSlugs
)

export default router

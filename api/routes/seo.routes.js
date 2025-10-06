import express from 'express'
import trimRequest from 'trim-request'
import { getSeoHeadController } from '../controllers/seo.controller.js'

const router = express.Router()
router.use(trimRequest.all)

// Public endpoint to fetch SEO snippet for a given path
router.get('/by-path', getSeoHeadController)

export default router



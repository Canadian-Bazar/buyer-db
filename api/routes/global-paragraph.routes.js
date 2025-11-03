import express from 'express'
import trimRequest from 'trim-request'
import { getGlobalParagraphController } from '../controllers/global-paragraph.controller.js'

const router = express.Router()
router.use(trimRequest.all)

// Public endpoint to fetch global paragraph for a given path
router.get('/', getGlobalParagraphController)

export default router


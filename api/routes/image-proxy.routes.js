import express from 'express'

import * as imageProxyController from '../controllers/image-proxy.controller.js'
import * as imageProxyValidator from '../validators/image-proxy.validator.js'


const router = express.Router()


router.get(
    '/:fileName',
    imageProxyValidator.validateImageProxy,
    imageProxyController.getMediaProxyController
)



export default router
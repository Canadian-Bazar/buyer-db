import express from 'express'
import * as businessTypesControllers from '../controllers/business-types.controller.js'
import * as businessTypesValidators from '../validators/business-types.validator.js'

const router = express.Router()


router.get(
    '/' ,
    businessTypesValidators.validateGetBusinessTypes,
    businessTypesControllers.getBusinessTypesController
)
export default router
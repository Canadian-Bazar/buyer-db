import Category from '../models/category.schema.js'
import express from 'express'
import trimRequest from 'trim-request'
import * as categoryValidators from '../validators/category.validator.js'
import * as categoryControllers from '../controllers/category.controller.js'

const router = express.Router()



router.get(
    '/sub-category',
    trimRequest.all ,
    categoryValidators.validateGetSubCategories ,
    categoryControllers.getSubCategories
)


router.get(
    '/',
    trimRequest.all ,
    categoryValidators.validateGetAllCategories ,
    categoryControllers.getAllCategories
)





export default router


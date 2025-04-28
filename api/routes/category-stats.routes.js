import express from 'express'

import * as categoryController from '../controllers/category-stats.controller.js'
import * as categoryValidator from '../validators/category-stats.validator.js'
import  trimRequest  from 'trim-request';
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';


const router = express.Router()

router.get(
    '/popular' ,
    trimRequest.all ,
    optionalAuth ,
    categoryValidator.getPopularCategoryValidator ,
    categoryController.getPopularCategories
    

)

router.get(
    '/user-frequent' ,
    trimRequest.all ,
    optionalAuth ,
    categoryValidator.getUserFrequentCategoriesValidator ,
    categoryController.getUserFrequentCategories
)


router.put(
    '/track-search/:categoryId' ,
    trimRequest.all ,
    optionalAuth ,
    categoryValidator.trackCategorySearchValidator ,
    categoryController.trackCategorySearch
)


router.put(
    '/track-view/:categoryId' ,
    trimRequest.all ,
    optionalAuth ,
    categoryValidator.trackCategoryViewValidator ,
    categoryController.trackCategoryView
)


export default router





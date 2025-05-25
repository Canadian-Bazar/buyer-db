import express from 'express'
import * as blogsControllers from '../controllers/blogs.controller.js'
import * as blogValidators from '../validators/blogs.validator.js'
import trimRequest from 'trim-request';

const router = express.Router()

router.get('/' ,
    trimRequest.all,
    blogValidators.validateGetBlogs,
    blogsControllers.getBlogsController
)

router.get('/:slug' ,
    trimRequest.all,
    blogValidators.validateGetBlogBySlug,
    blogsControllers.getBlogBySlugController
)

export default router
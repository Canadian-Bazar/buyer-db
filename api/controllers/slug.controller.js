import Blogs from '../models/blogs.schema.js'
import Products from '../models/products.schema.js'
import Categories from '../models/category.schema.js'
import Services from '../models/service.schema.js'
import { matchedData } from 'express-validator';
import  httpStatus  from 'http-status';
import buildResponse from '../utils/buildResponse.js'


export const getBlogsSlugs = async (req, res) => {
    try{
        const {page = 1 , limit =10} = matchedData(req)
        const options = {
            page: parseInt(page , 10) ,
            limit: parseInt(limit , 10) ,
            sort : { createdAt : -1 } ,
            select: 'slug -_id'
        }
        
        const filter = { isDeleted: { $ne: true }  , slug: { $ne: null }  }
        
        const blogsSlugs = await Blogs.find(filter).select('slug -_id').lean().skip((options.page - 1) * options.limit).limit(options.limit)
        const totalBlogs = await Blogs.countDocuments(filter)
        const totalPages = Math.ceil(totalBlogs / options.limit)

        const hasNext = options.page < totalPages
        const hasPrev = options.page > 1

        const responseData = {
            docs: blogsSlugs.map(blog => blog.slug) ,
            page: options.page ,
            limit: options.limit ,
            totalDocs: totalBlogs ,
            totalPages ,
            hasNext ,
            hasPrev ,
            nextPage: hasNext ? options.page + 1 : null ,
            prevPage: hasPrev ? options.page - 1 : null ,
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , responseData))
      
    }catch(err){
        handleError(res , err)
    }
}


export const getProductsSlugs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = matchedData(req)
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: 'slug -_id'
    }

    const filter = { isDeleted: { $ne: true }, completionPercentage: 100 }

    const productsSlugs = await Products.find(filter)
      .select(options.select)
      .lean()
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)

    const totalProducts = await Products.countDocuments(filter)
    const totalPages = Math.ceil(totalProducts / options.limit)

    const hasNext = options.page < totalPages
    const hasPrev = options.page > 1

    const responseData = {
      docs: productsSlugs.map(p => p.slug),
      page: options.page,
      limit: options.limit,
      totalDocs: totalProducts,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? options.page + 1 : null,
      prevPage: hasPrev ? options.page - 1 : null
    }

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, responseData))
  } catch (err) {
    handleError(res, err)
  }
}


export const getServicesSlugs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = matchedData(req)
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: 'slug -_id'
    }

    const filter = { isDeleted: { $ne: true }, completionPercentage: 100 }

    const servicesSlugs = await Services.find(filter)
      .select(options.select)
      .lean()
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)

    const totalServices = await Services.countDocuments(filter)
    const totalPages = Math.ceil(totalServices / options.limit)

    const hasNext = options.page < totalPages
    const hasPrev = options.page > 1

    const responseData = {
      docs: servicesSlugs.map(s => s.slug),
      page: options.page,
      limit: options.limit,
      totalDocs: totalServices,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? options.page + 1 : null,
      prevPage: hasPrev ? options.page - 1 : null
    }

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, responseData))
  } catch (err) {
    handleError(res, err)
  }
}

export const getCategoriesSlugs = async (req, res) => {
  try {
    const { page = 1, limit = 10, slug } = matchedData(req)
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      select: 'slug -_id'
    }

    let filter = { isActive: true }

    if (slug) {
      const category = await Categories.findOne({ slug })
      if (!category) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json(buildResponse(httpStatus.NOT_FOUND, 'Category not found'))
      }

      const categoryIds = new Set([category._id.toString()])

      if (category.ancestors?.length) {
        category.ancestors.forEach(a => categoryIds.add(a.toString()))
      }

      const children = await Categories.find({
        $or: [{ parentCategory: category._id }, { ancestors: category._id }]
      }).select('_id')

      children.forEach(c => categoryIds.add(c._id.toString()))

      filter = { ...filter, _id: { $in: Array.from(categoryIds) } }
    }

    const categorySlugs = await Categories.find(filter)
      .select(options.select)
      .lean()
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)

    const totalCategories = await Categories.countDocuments(filter)
    const totalPages = Math.ceil(totalCategories / options.limit)

    const hasNext = options.page < totalPages
    const hasPrev = options.page > 1

    const responseData = {
      docs: categorySlugs.map(c => c.slug),
      page: options.page,
      limit: options.limit,
      totalDocs: totalCategories,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? options.page + 1 : null,
      prevPage: hasPrev ? options.page - 1 : null
    }

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, responseData))
  } catch (err) {
    handleError(res, err)
  }
}
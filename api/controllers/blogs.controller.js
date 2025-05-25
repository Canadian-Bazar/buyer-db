import Blogs from '../models/blogs.schema.js';
import httpStatus from 'http-status';
import {matchedData} from 'express-validator'
import handleError from '../utils/handleError.js';
import buildResponse from '../utils/buildResponse.js';
import buildErrorObject from '../utils/buildErrorObject.js';



export const getBlogsController = async( req, res ) => {
    try{
        const validatedData = matchedData(req);
        const page = validatedData.page || 1;
        const limit = Math.min(validatedData.limit || 10, 50);
        const search = validatedData.search || '';
        const latest = validatedData.latest || '';
        const query = {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ]
        };

        if(latest){
       
            var sortQuery = { createdAt: -1 };
        }

        const [blogs , blogsCount] = await Promise.all([ Blogs.find(query)
                                 .select('-content -v -_id')
                                 .skip((page - 1) * limit)
                                 .limit(limit)
                                 .sort(sortQuery || {})
                                 .lean() , Blogs.countDocuments(query) ]);

        const hasNext = (page * limit) < blogsCount;

        const response ={
            docs:blogs ,
            hasNext:hasNext,
            hasprev: page > 1,
            totalPages: Math.ceil(blogsCount / limit),
            totalDocs: blogsCount,

        }   
        
        return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , response));
    } catch(err){
        handleError(res, err);
    }
}



export const getBlogBySlugController = async( req, res ) => {
    try{

        console.log('bro')

        const validatedData = matchedData(req);
        const { slug } = validatedData;
        const blog = await Blogs.findOne({ slug })
            .select(' -v -_id')
            .lean();

            if(!blog){
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Blog not found');
            }


        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , blog));
    }catch(err){
        handleError(res, err);

    }
}
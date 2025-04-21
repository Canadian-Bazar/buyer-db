import { matchedData } from 'express-validator';
import Liked from '../models/liked.schema.js' ;
import handleError from '../utils/handleError.js';
import { likeTypes } from '../utils/likeTypes.js';
import Product from '../models/products.schema.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import httpStatus from 'http-status'
import { likeProductHandler } from '../redis/like.redis.js';
import buildResponse from '../utils/buildResponse.js';


export const handleLikeDislikeController = async (req , res)=>{
    try{

        const validatedData = matchedData(req) ;
        const { type , productId } = validatedData ;

        const productExists = await Product.exists({ _id: productId }) ;
        if (!productExists) {
            throw buildErrorObject(httpStatus.BAD_REQUEST, 'Product not found');
        }

        await likeProductHandler(productId , req.user._id , type) ;

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK)
        )

      
    }catch(err){
        handleError(res , err)
    }
}
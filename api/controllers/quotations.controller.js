import { matchedData } from 'express-validator'
import Quotation from '../models/quotations.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import  httpStatus  from 'http-status';
import Product from '../models/products.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js';



export const createQuotationController = async( req , res)=>{
    try{
        const validatedData = matchedData(req)
        const {slug}  = validatedData

        const [productExists , quotationExists] = await Promise.all([
            Product.findOne({slug}) ,
            Quotation.findOne({slug , buyer:req.user._id , status:{
                $in: ['sent'  , 'in-progress']
            }}),
        ])

        if(!productExists){
            throw buildErrorObject(httpStatus.BAD_REQUEST , 'Product Not Found')
        }
        if(quotationExists){
            throw buildErrorObject(httpStatus.BAD_REQUEST , 'Quotation already exists')
        }

        console.log(validatedData)

         await Quotation.create({
            ...validatedData,
            productId:productExists._id ,
            buyer:req.user._id,
            seller:productExists.seller,
            status:'sent',
        })

        res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED , 'Quotation Sent Successfully'))
    }catch(err){
        handleError(res , err)
    }
}


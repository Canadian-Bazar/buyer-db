import { matchedData } from 'express-validator'
import Quotation from '../models/quotations.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import  httpStatus  from 'http-status';
import Product from '../models/products.schema.js'



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
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.BAD_REQUEST , 'Product not found'))
        }
        if(quotationExists){
            return res.status(httpStatus.BAD_REQUEST).json(buildResponse(httpStatus.BAD_REQUEST , 'Quotation already exists'))
        }

        console.log(validatedData)

         await Quotation.create({
            ...validatedData,
            buyer:req.user._id,
            seller:productExists.seller,
            status:'sent',
        })

        res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED , 'Quotation Sent Successfully'))
    }catch(err){
        handleError(res , err)
    }
}


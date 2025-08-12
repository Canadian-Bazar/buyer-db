import handleError from "../utils/handleError.js";
import buildErrorObject from "../utils/buildErrorObject.js";
import buildResponse from "../utils/buildResponse.js";
import StoreClainUsers from '../models/store-claim-users.schema.js'
import  { matchedData } from 'express-validator';
import httpStatus from 'http-status';




export const getStoresController = async(req , res)=>{
    try{
        const validatedData = matchedData(req)

        const page = validatedData.page || 1
        const limit = Math.min(validatedData.limit || 10 , 50)

        const filter ={}

        if(validatedData.search){
            filter.$or=[
                {
                    companyName:{
                        $regex:validatedData.search ,
                        $options:'i'
                    }
                } ,
                {
                    email:{
                        $regex:validatedData.search ,
                        $options:'i'
                    }
                } ,
                {
                    phoneNumber:{
                        $regex:validatedData.search ,
                        $options:'i'
                    }
                }
            ]
        }



        const stores = await StoreClainUsers.find(filter).skip((page-1)*limit).limit(limit)

        const total = await StoreClainUsers.countDocuments(filter)



        const response ={
            docs:stores ,
            hasPrev:page>1 ,
            hasNext:(limit*page)<total ,
            totalPages:Math.ceil(total/limit)
        }



        res
            .status(httpStatus.OK)
            .json(buildResponse(httpStatus.OK , response))
                 






    }catch(err){
        handleError(res , err)
    }
}

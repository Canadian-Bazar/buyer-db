import Buyer from '../models/buyer.schema.js'
import mongoose from 'mongoose'
import handleError from '../utils/handleError.js'
import { matchedData } from 'express-validator'
import { uploadFile } from '../helpers/aws-s3.js'
import  httpStatus  from 'http-status';
import buildResponse from '../utils/buildResponse.js'




export const updateProfileController = async( req , res)=>{
    try{

        const validatedData = matchedData(req)

        if(req?.files){
            const imageUrls = await uploadFile(req.files)
            validatedData.profilePic=imageUrls[0]
        }


       const buyer =  await Buyer.findByIdAndUpdate(
            req.user._id , 
            { $set: validatedData } , 
            { new:true  }
        )
        if(!buyer){
            return res.status(httpStatus).json(buildResponse(httpStatus.NOT_FOUND , 'Buyer not found'))
        }


        res.status(200).json({ message: 'Profile updated successfully' })



        
    }catch(err){handleError(res , err)}
}


export const getProfileController = async(req , res)=>{
    try{
        const buyer = await Buyer.findById(req.user._id).select('-password')
        if(!buyer){
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND , 'Buyer not found'))
        }
        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , buyer))
    }catch(err){
    handleError(res , err)
}

}
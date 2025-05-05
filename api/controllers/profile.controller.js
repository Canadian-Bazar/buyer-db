import Buyer from '../models/buyer.schema.js'
import mongoose from 'mongoose'
import handleError from '../utils/handleError.js'
import { matchedData } from 'express-validator'
import { uploadFile } from '../helpers/aws-s3.js'
import  httpStatus  from 'http-status';
import buildResponse from '../utils/buildResponse.js'
import Language from '../models/language.schema.js'
import Currency from '../models/currency.schema.js'
import PaymentMethod from '../models/payment-methods.schema.js'




export const getProfileOptions = async(req , res)=>{
    try{
        const languages = await Language.find({}).select('-__v -createdAt -updatedAt')
        const currencies = await Currency.find({}).select('-__v -createdAt -updatedAt')
        const paymentMethods = await PaymentMethod.find({}).select('-__v -createdAt -updatedAt')
        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , {
            languages,
            currencies ,
            paymentMethods
        }))
    }catch(err){
        handleError(res , err)
    }
}


export const updateProfileController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        
        const updateData = { ...validatedData };
        
        if (req?.files && req.files.length > 0) {
            const imageUrls = await uploadFile(req.files);
            updateData.profilePic = imageUrls[0];
            updateData.avatar = null;
        } else if (validatedData.avatar) {
            updateData.profilePic = null;
        }
        
       
        
        const buyer = await Buyer.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        );
        
        if (!buyer) {
            return res.status(httpStatus.NOT_FOUND).json(
                buildResponse(httpStatus.NOT_FOUND, 'Buyer not found')
            );
        }
        
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, 'Profile updated successfully', { buyer })
        );
    } catch (err) {
        handleError(res, err);
    }
};


export const getProfileController = async(req , res)=>{
    try{
        const buyer = await Buyer.findById(req.user._id).select('-password').populate('preferredLanguage preferredCurrency paymentMethods')
        if(!buyer){
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND , 'Buyer not found'))
        }
        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , buyer))
    }catch(err){
    handleError(res , err)
}

}




export const updateProfilePreferencesController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        console.log(validatedData)
        const updateData = {};
        const checkPromises = [];
        
        if (Object.prototype.hasOwnProperty.call(validatedData, 'preferredLanguage')) {
            if (validatedData.preferredLanguage === null || 
                validatedData.preferredLanguage === 'null' || 
                validatedData.preferredLanguage === '') {
                updateData.preferredLanguage = null;
            } else {
                checkPromises.push(
                    Language.findById(validatedData.preferredLanguage)
                        .then(language => {
                            if (!language) {
                                throw buildErrorObject(
                                    httpStatus.BAD_REQUEST,
                                    'Preferred language not found in database'
                                );
                            }
                            updateData.preferredLanguage = language._id;
                            return true;
                        })
                );
            }
        }
        
        if (Object.prototype.hasOwnProperty.call(validatedData, 'preferredCurrency')) {
            if (validatedData.preferredCurrency === null || 
                validatedData.preferredCurrency === 'null' || 
                validatedData.preferredCurrency === '') {
                updateData.preferredCurrency = null;
            } else {
                checkPromises.push(
                    Currency.findById(validatedData.preferredCurrency)
                        .then(currency => {
                            if (!currency) {
                                throw buildErrorObject(
                                    httpStatus.BAD_REQUEST,
                                    'Preferred currency not found in database'
                                );
                            }
                            updateData.preferredCurrency = currency._id;
                            return true;
                        })
                );
            }
        }
        
        if (Object.prototype.hasOwnProperty.call(validatedData, 'paymentMethods')) {
            const paymentMethodsArray = validatedData.paymentMethods;
            
            if (paymentMethodsArray === null || 
                paymentMethodsArray === 'null' || 
                paymentMethodsArray === '' || 
                (Array.isArray(paymentMethodsArray) && paymentMethodsArray.length === 0)) {
                updateData.paymentMethods = [];
            } else if (Array.isArray(paymentMethodsArray) && paymentMethodsArray.length > 0) {
                const uniquePaymentMethodIds = [...new Set(paymentMethodsArray)];
                
                checkPromises.push(
                    PaymentMethod.find({
                        _id: { $in: uniquePaymentMethodIds },
                        isActive: true
                    }).then(paymentMethods => {
                        if (paymentMethods.length !== uniquePaymentMethodIds.length) {
                            const foundIds = paymentMethods.map(pm => pm._id.toString());
                            const notFoundIds = uniquePaymentMethodIds.filter(id => !foundIds.includes(id));
                            
                            throw buildErrorObject(
                                httpStatus.BAD_REQUEST,
                                `${notFoundIds.length} payment method(s) were not found or are inactive`
                            );
                        }
                        
                        updateData.paymentMethods = paymentMethods.map(pm => pm._id);
                        return true;
                    })
                );
            }
        }
        
        await Promise.all(checkPromises);
        
        if (Object.keys(updateData).length === 0) {
            return res.status(httpStatus.BAD_REQUEST).json(
                buildResponse(httpStatus.BAD_REQUEST, 'No valid preferences provided for update')
            );
        }
        
        const buyer = await Buyer.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).populate('preferredLanguage preferredCurrency paymentMethods');
        
        if (!buyer) {
            return res.status(httpStatus.NOT_FOUND).json(
                buildResponse(httpStatus.NOT_FOUND, 'Buyer not found')
            );
        }
        
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, 'Preferences updated successfully')
        );
    } catch (err) {
        handleError(res, err);
    }
};


export const getUserPreferencesController = async(req , res)=>{
    try{
        const preferences = await Buyer.findById(req.user._id)
          .select('preferredLanguage preferredCurrency paymentMethods')
          .populate('preferredLanguage preferredCurrency paymentMethods')
          .lean();

        if (!preferences) {
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Buyer not found'));
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, preferences));
    }catch(err){
        handleError(res , err)
    }
}
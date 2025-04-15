import mongoose from 'mongoose'

const VerificationSchema = new mongoose.Schema({
    email:{
        type:String ,
        trim:true ,
        lowercase:true ,
        index:true
        
    } ,
    phoneNumber:{
        type:String ,
        trim:true ,
        index:true
    } ,

    isEmailVerified:{
        type:Boolean ,
        required:true ,
        default:false
    } ,
    isPhoneNumberVerified:{
       type:Boolean ,
        required:true ,
        default:false
    } ,

    emailOtp:{
        type:String ,
        trim:true
    } ,

    phoneOtp:{
        type:String ,
        trim:true
    } ,
} , {collection:'Verifications' , timestamps:true , expireAfterSeconds:3600})


export default mongoose.model('Verifications' , VerificationSchema)
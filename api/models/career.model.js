import mongoose from "mongoose";


const careerSchema = new mongoose.Schema({
    fullName:{
        type:String ,
        required:true
    } ,

    email:{
        type:String ,
        required:true ,
        index:true ,
    } ,
    phoneNumber:{
        type:String ,
        required:true
    } ,
    street:{
        type:String ,
        required:true
    } ,
    city:{
        type:String ,
        required:true
    } ,
    state:{
        type:String ,
        required:true
    } ,
    postalCode:{
        type:String ,
        required:true
    } ,
    category:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Category' ,
        required:true
    } ,
    resume:{
        type:String ,
        required:true
    } ,
    coverLetter:{
        type:String ,
    } ,

    isVerified:{
        type:Boolean ,
        default:false
    } ,
} , {
    timestamps: true,
    collection: 'Career'
})

export default mongoose.model('Career', careerSchema);
  
import mongoose from "mongoose";



const StoreClaimUsers = new mongoose.Schema({
    companyName:{
        type:String, 
        required:true
    } ,

    email:{
        type:String, 
        index:true
       
    } ,

    phoneNumber:{
        type:String, 
        index:true

    }

    ,
    street:{
        type:String, 
    } ,

    city:{
        type:String, 
    } ,

    province:{
        type:String, 
    } ,

    postalCode:{
        type:String, 
    
    } ,

    isClaimed:{
        type:Boolean, 
        default:false

    } ,
    category:{
        type: mongoose.Types.ObjectId ,
        ref:'Category'
    }
} , {
    collection:"StoreClaimUsers" ,
    timestamps:true
})



export default mongoose.model("StoreClaimUsers" , StoreClaimUsers)
import mongoose from 'mongoose'

const ServiceReviewSchema = new mongoose.Schema({

    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Buyer',
        required:true

    } ,

    service:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Service',
        required:true

    } ,

    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    } ,

    comment:{
        type:String,
        required:true
    }


    
} ,{collection:'ServiceReview' , timestamps:true})

export default mongoose.model('ServiceReview', ServiceReviewSchema)
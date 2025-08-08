import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema({

    buyer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Buyer',
        required:true

    } ,

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
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


    
} ,{collection:'Review' , timestamps:true})

export default mongoose.model('Review', ReviewSchema)
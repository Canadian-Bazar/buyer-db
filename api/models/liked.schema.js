import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const LikedSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Types.ObjectId ,
        ref:'Product' , 
        required:true  ,
        index:true
    } ,
    buyerId:{
        type:mongoose.Types.ObjectId ,
        ref:'Buyer' ,
        required:true ,
        index:true
    }
} , { 
    timestamps:true ,
    collection:'Liked'
})

LikedSchema.plugin(paginate)
LikedSchema.plugin(aggregatePaginate)


export default mongoose.model('Liked' , LikedSchema)
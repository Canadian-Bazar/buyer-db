import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const LikedSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Types.ObjectId ,
        ref:'Product' , 
        required:true 
    } ,
    buyerId:{
        type:mongoose.Types.Object ,
        ref:'Buyer' ,
        required:true
    }
} , {
    timestamps:true ,
    collection:true
})

LikedSchema.plugin(paginate)
LikedSchema.plugin(aggregatePaginate)


export default mongoose.model('Liked' , LikedSchema)
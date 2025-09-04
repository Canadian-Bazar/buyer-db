import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const ServiceLikedSchema = new mongoose.Schema({
    serviceId:{
        type:mongoose.Types.ObjectId ,
        ref:'Service' , 
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
    collection:'ServiceLiked'
})

ServiceLikedSchema.plugin(paginate)
ServiceLikedSchema.plugin(aggregatePaginate)


export default mongoose.model('ServiceLiked' , ServiceLikedSchema)
import mongoose, { mongo } from "mongoose";


const ProductAttributesSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Types.ObjectId ,
        ref:'Product' ,
        required:true ,
        index:true
    } ,

    name:{
        type:String,
        required:true,
        trim:true
    } ,
    attributes: [{
    field: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],



} ,{
  collection:'ProductAttributes' ,
  timestamps:true
})


export default mongoose.model('ProductAttributes' , ProductAttributesSchema)



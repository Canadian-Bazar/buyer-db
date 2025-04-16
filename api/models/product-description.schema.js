import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate  from 'mongoose-aggregate-paginate-v2';


const ProductDescriptionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  points: [String],
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
  images: [String],

} , {
    timestamps:true ,
    collection:'ProductDescription'
});
ProductDescriptionSchema.plugin(paginate)
ProductDescriptionSchema.plugin(aggregatePaginate)

export default mongoose.model('ProductDescription' , ProductDescriptionSchema)
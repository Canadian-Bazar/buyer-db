import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";



const ProductVariationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  variations: [{
    field: {
      type: String,
      required: true
    },
    values: [String]
  }],
  customizableOptions: [
    {
      option: String,
      quantity: Number
    }
  ]
  // variantCombinations: [{
  //   combination: {
  //     type: Map,
  //     of: String
  //   },
  //   sku: String,
  //   price: Number,
  //   stock: Number,
  //   images: [String]
  // }]
}, { collection: 'ProductVariation', timestamps: true });

ProductVariationSchema.plugin(paginate)
ProductVariationSchema.plugin(aggregatePaginate)


export default mongoose.model('ProductVariation' , ProductVariationSchema)
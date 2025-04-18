import mongoose from "mongoose";
import  paginate  from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";



const ProductPricingSchema = new mongoose.Schema({
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
  
    quantityPriceTiers: [{
      min: {
        type: Number,
        required: true,
        min: 1
      },
      max: {
        type: Number,
        required: false
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }],

    leadTime: {
      min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number
      },
      unit: {
        type: String,
        
      }
    },
    // isOnSale: {
    //   type: Boolean,
    //   default: false
    // },
    // salePrice: Number,
    // saleEndDate: Date
  } , {collection:'ProductPricing' , timestamps:true});

  ProductPricingSchema.plugin(paginate)
  ProductPricingSchema.plugin(aggregatePaginate)


  export default mongoose.model('ProductPricing' , ProductPricingSchema)
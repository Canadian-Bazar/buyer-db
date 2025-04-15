import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import paginate from 'mongoose-paginate-v2'

const ProductSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    priceRange: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: function(value) {
            return value >= this.priceRange.min;
          },
          message: 'Maximum price must be greater than or equal to minimum price'
        }
      }
    },

    seller:{
        type:mongoose.Types.ObjectId , 
        ref:"Seller" , 
        required:true

    } ,

    images:[
        {
            type:String , 
            required:true
        }
    ] ,


    avgRating:{
        type:Number , 
        default:0
    } ,
    ratingsCount:{
        type:Number ,
        default:0
    } ,
    minQuantity:{
        type:Number , 
        default:1
    } ,
    
    isActive: {
      type: Boolean,
      default: true
    }
  }, { timestamps: true , collection:'Product' });


ProductSchema.plugin(paginate);
ProductSchema.plugin(aggregatePaginate)


export default mongoose.model('Product', ProductSchema)
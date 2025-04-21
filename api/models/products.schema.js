import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import paginate from 'mongoose-paginate-v2'

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  avgRating: {
    type: Number, 
    default: 0.0,
    min: 0,
    max: 5
  },
  ratingsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true
  },
  seller: {
    type: mongoose.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  images: [String],
  
  about: [String],
  
  services: [String], 
  
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductDescription'
  },
  minPrice:{
    type:Number ,
    required:true ,
  } ,
  maxPrice:{
    type:Number ,
    required:true
  } ,
  moq:{
    type:Number ,
    required:true ,
    default:1
  } ,
  categoryId:{
    type:mongoose.Types.ObjectId ,
    ref:'Category',
    required:true
  } ,
  isVerified:{
    type:Boolean ,
    default:false ,
    required:true
} ,
deliveryDays:{
  type:Number ,
  required:true,
  default:1
} ,
isCustomizable:{
  type:Boolean ,
  default:false,
  required:true
}


  

}, { timestamps: true , collection:"Product" } );

ProductSchema.index({ name: 'text' });
ProductSchema.index({ isVerified: 1 });
ProductSchema.index({ avgRating: -1 });

ProductSchema.plugin(paginate)
ProductSchema.plugin(aggregatePaginate)

ProductSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  
  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') 
    .trim(); 
  
  try {
    let slug = baseSlug;
    let count = 0;
    let existingProduct;
    
    do {
      if (count > 0) {
        slug = `${baseSlug}-${count}`;
      }
      
      existingProduct = await mongoose.models.Product.findOne({ slug });
      count++;
    } while (existingProduct);
    
    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});



export default mongoose.model('Product' , ProductSchema)



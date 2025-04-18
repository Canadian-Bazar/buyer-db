import mongoose from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import paginate from 'mongoose-paginate-v2'

// // const ProductSchema = new mongoose.Schema({
// //     name: {
// //       type: String,
// //       required: true,
// //       trim: true
// //     },
// //     description: {
// //       type: String,
// //       trim: true
// //     },
// //     categoryId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Category',
// //       required: true
// //     },
// //     priceRange: {
// //       min: {
// //         type: Number,
// //         required: true,
// //         min: 0
// //       },
// //       max: {
// //         type: Number,
// //         required: true,
// //         min: 0,
// //         validate: {
// //           validator: function(value) {
// //             return value >= this.priceRange.min;
// //           },
// //           message: 'Maximum price must be greater than or equal to minimum price'
// //         }
// //       }
// //     },

// //     seller:{
// //         type:mongoose.Types.ObjectId , 
// //         ref:"Seller" , 
// //         required:true

// //     } ,

// //     images:[
// //         {
// //             type:String , 
// //             required:true
// //         }
// //     ] ,


// //     avgRating:{
// //         type:Number , 
// //         default:0
// //     } ,
// //     ratingsCount:{
// //         type:Number ,
// //         default:0
// //     } ,
// //     minQuantity:{
// //         type:Number , 
// //         default:1
// //     } ,
    
// //     isActive: {
// //       type: Boolean,
// //       default: true
// //     }
// //   }, { timestamps: true , collection:'Product' });



// const ProductSchema = new mongoose.Schema({
//   name:{
//     type:String ,
//     required:true ,

//   } ,
//   avgRating:{
//     type:mongoose.Types.Double ,
//     default:0.0
    
//   } ,
//   ratingsCount:{
//     type:Number ,
//     default:0
//   } ,
//   isVerified:{
//     type:Boolean ,
//     default:false ,
//     required:true
//   } ,
//   seller:{
//     type:mongoose.Types.ObjectId ,
//     ref:'Seller' ,
//     required:true
//   } ,

//   images:[
//     {
//       type:String ,
//       require:true
//     }
//   ]  ,

//   about:[
//     {
//       type:String ,
//       required:true
//     }
//   ] ,

//   // leadTime:[
//   //   {

//   //   }
//   // ]


//   service:[
//     {
//       type:String ,

//     }
//   ] ,

//   productDescription:[
//     {
//       points :[
//         {
//           type:String 
//         }
//       ] ,

//       attributes:[
//         {
//           field:String ,
//           value;String
//         }
//       ] ,
//       images:[
//         {
//           type:String
//         }
//       ]
//     }
//   ]  ,

//   quantityPriceTiers:[
//     {
//       min:Number ,
//       max:Number ,
//       price:Number
//     }
//   ] ,

//   variations:[
//     {
//       field:String , 
//       values:[{
//         type:String
//       }]
//     }
//   ]





// })


// ProductSchema.plugin(paginate);
// ProductSchema.plugin(aggregatePaginate)


// export default mongoose.model('Product', ProductSchema)



// Core Product Schema
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
    type: mongoose.Schema.Types.ObjectId,
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
  category:{
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
    
    // Set the unique slug
    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});



export default mongoose.model('Product' , ProductSchema)



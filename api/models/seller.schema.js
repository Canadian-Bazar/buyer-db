import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

const SellerSchema = new mongoose.Schema({ 
    companyName: {
          type: String,
          required: true,
          trim: true,
     },

     phone: {
          type: String,
          required: true,
          trim: true,
          unique: true,
     },
     email: {
          type: String,
          required: true,
          trim: true,
          unique: true,
          lowercase: true,
     },

     parentCategory:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
          required: false,
     } ,

     businessType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'BusinessType',
          required: false,
     },

     categories: [
          {
                type: mongoose.Types.ObjectId ,
                ref:'Category' ,
                required:true
          }
     ],
     businessNumber: {
          type: String,
          required: false,
          trim: true,
     },
    
     approvalStatus: {
          type: String,
          enum: ['pending' ,'submitted', 'approved', 'rejected'],
          default: 'approved',
     },
     password: {
          type: String,
          required: true,
          trim: true,
     },
   
     logo: {
          type: String
     },


     street:{
        type:String ,
        required:false
    } ,
    city:{
        type:String , 
        required:false ,
    } ,
    state:{
        type:String ,
        required:false ,
    } ,

    zip:{
        type:String ,
        required:false ,
    } ,
   
     isVerified: {
          type: Boolean,
          default: true,
          required: true
     } ,
     isProfileComplete:{
          type:Boolean ,
          default:false , 
          required:true
     } ,

     isBlocked: {
          type: Boolean,
          default: false,
          required: true
     },
     blockReason: {
          type: String,
          required: false,
          trim: true
     },

     stripeCustomerId:{
          type:String
     }
    ,

     companyWebsite:{
          type:String ,
     } ,

     yearEstablished:{
          type:Number ,
     } ,

     numberOfEmployees:{
          type:Number ,
     } ,

     certifications:[{
          name: String ,
          url: String
     }]  ,

     socialMediaLinks:[{
          platform: String ,
          url: String
     }] ,

     languagesSupported:[
          {
               code:String ,
               name:String 
          }
     ]

}, {
     timestamps: true,
     collection: 'Sellers',
})

  SellerSchema.plugin(paginate)
  SellerSchema.plugin(aggregatePaginate)

  export default mongoose.model('Seller', SellerSchema)
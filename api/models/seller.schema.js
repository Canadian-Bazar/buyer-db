import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

const SellerSchema = new mongoose.Schema({ 
    companyName:{
        type:String ,
        required:true,
        trim:true,
    } ,

   phone: {
    type: String,
    required: true, 
    trim: true,
    unique: true,

    } ,
    email:{
        type:String ,
        required:true,
        trim:true,
        unique:true,
        lowercase:true,
    } ,

    businessType:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'BusinessType',
        required:true,
    } ,
    businessNumber:{
        type:String ,
        required:true,
        trim:true,
    } ,
    workTimingsFrom:{
        type:String , 
    } ,
    workTimingsTo:{
        type:String
    } ,
    approvalStatus:{
        type:String,
        enum:['pending','approved','rejected'],
        default:'pending',
    } ,
    password:{
        type:String ,
        required:true,
        trim:true,
    } ,
    isTwoFaEnabled:{
        type:Boolean ,
        default:false
    } ,
    twoFaSecret:{
        type:String ,
    } ,
    profileImage:{
        type:String
    }   ,
    city:{
      type:String ,
      required:true 
    } ,
    state:{
      type:String ,
      required:true 
    } ,
    isVerified:{
        type:Boolean ,
        default:false ,
        required:true
    }

  } , {
    timestamps:true ,
    collection:'Sellers',
  })

  SellerSchema.plugin(paginate)
  SellerSchema.plugin(aggregatePaginate)

  export default mongoose.model('Seller', SellerSchema)
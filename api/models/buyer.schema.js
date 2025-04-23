import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

const BuyerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      index: true,
      unique: true,
    },

    phoneNumber:{
      type:String ,
      required:true ,
      unique:true ,
      index:true ,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    roleId:{
      type:mongoose.Schema.Types.ObjectId ,
      ref:'Roles' ,
      required:true 
    } ,

    loginAttempts:{
      type:Number ,
      default:0,
      select:false
    } ,
    blockExpires: {
      type: Date,
      default: new Date(), 
      select: false 
    }
    ,
    city:{
      type:String ,
      required:true 
    } ,
    state:{
      type:String ,
      required:true 
    } ,

    memberId:{
      type:String , 
      unique:true ,
      index:true
    } ,

    profilePic:{
      type:String ,
    }
   
  },

 
  { timestamps: true, collection: 'Buyer' } )



  BuyerSchema.plugin(paginate)
  BuyerSchema.plugin(aggregatePaginate)

export default mongoose.model('Buyer', BuyerSchema)

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'
import paginate from 'mongoose-paginate-v2'

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      select: false }
    ,
    phoneNumber:{
      type:String , 
      required:true
    }
  },

 
  { timestamps: true, collection: 'Users' } )

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    this.password = await bcrypt.hash(this.password, 10)
    next()
  } catch (error) {
    next(error)
  }
})

UserSchema.plugin(paginate)
UserSchema.plugin(aggregatePaginate)

export default mongoose.model('User', UserSchema)

import mongoose from 'mongoose'



const ServiceOrderSchema = new mongoose.Schema({


    serviceId:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Service' ,
        required:true
    } ,

    moq:{
        type:Number ,
        default:null
    } ,

    standardLeadTime:{
        time:{
            type:Number ,
            required:true
        } ,

        unit:{
            type:String ,
            required:true
        }
    } ,

    rushOptions:[{
        min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number
      },
      days: {
        type: Number,
        
      }
    }
        
    ]
} , {collection:"ServiceOrderSchema" , timestamps:true})


export default mongoose.model('ServiceOrderSchema', ServiceOrderSchema)
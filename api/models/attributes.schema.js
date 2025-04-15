import mongoose from 'mongoose'

const AttributeSchema = new mongoose.Schema({

    productId:{
        type:mongoose.Types.ObjectId , 
        ref:"Product" , 
        required:true ,
        index:true
    } ,
    name: {
      type: String,
      required: true,
      trim: true
    },
    values: {
      type: mongoose.Schema.Types.Mixed, 
      required: true
    }
  } , {timestamps:true , collection:'Attribute'});


  export default mongoose.model("Attribute" , AttributeSchema)
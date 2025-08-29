import mongoose from 'mongoose'




const ServiceCustomizationSchema = new mongoose.Schema({


    serviceId:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Service' ,
        required:true
    } ,
    designImages:[{
        type:String ,
    
    }]
     ,


     logo:{
        type:String ,

     } ,

     colorChoices:[
        {
            type:String ,
        }
     
     ] ,

     rapidPrototype:{
        type:Boolean ,
        required:true ,
        default:false

     }
} , {
    collection:'ServiceCustomization' ,
    timestamps:true

})


export default mongoose.model('ServiceCustomization', ServiceCustomizationSchema)
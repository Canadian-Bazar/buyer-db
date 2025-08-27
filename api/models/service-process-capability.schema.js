import mongoose from 'mongoose'

const SerivesProcessAndCapabilitySchema = new mongoose.Schema({


    serviceId:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Service' ,
        required:true
    } ,

    processType:{
        type:String ,
        required:true
    } ,

    materialsSupported:[
        {
            type:String ,
            required:true
        }
    ] ,

    surfaceFinishAndCoatings:[
        {
            type:String ,
            required:true
        }
    ] ,


    tolerance:{
        type:Number ,
        default:null ,
    }



    }




    , {
        collection: 'SerivesProcessAndCapability',
        timestamps: true
    }




)



export default mongoose.model('SerivesProcessAndCapability', SerivesProcessAndCapabilitySchema)
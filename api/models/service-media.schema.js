import mongoose from 'mongoose'

const ServiceMediaSchema = new mongoose.Schema({

    serviceId:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Service' ,
        required:true} ,

    images:[
        {
            type:String ,
            required:true
        }
    
    ] ,


    videos:[
        {
            type:String ,
            required:true
        }
    ] ,

    warranty:
        {
            duration:{
                type:Number ,
            } ,

            unit:{
                type:String ,
            
            } ,
        } ,

        industryCertifications:[
            {
                type:String ,
                required:true
            }
        ] ,


        brochure:{
            type:String
        }

        
    


} , {collection:'ServiceMedia' , timestamps:true})

export default mongoose.model('ServiceMedia', ServiceMediaSchema)
import mongoose from 'mongoose'


const CNCQuote = new mongoose.Schema({
    name:{
        type:String ,
        required:true ,
    } ,

    contact:{
        type:String ,
        required:true
    } ,

    city:{
        type:String ,
        required:true
    } ,
    workType:{
        type:String , 
        required:true
    
    } ,

    budget:{
        type:String , 
    } ,

    timeline:{
        type:String
    } ,
    description:{
        type:String
    }
} ,


{
    collection:'CNCQuotae' ,
    timestamps:true

}

)



export default mongoose.model('CNCQuote' , CNCQuote)
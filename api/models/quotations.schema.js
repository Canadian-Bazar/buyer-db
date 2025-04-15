import mongoose from 'mongoose'


const QuotationSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Types.ObjectId ,
        ref:'Product' ,
        required:true
    } ,
    buyer:{
        type:mongoose.Types.ObjectId ,
        ref:'Buyer' ,
        required:true

    } ,
    seller:{
        type:mongoose.Types.ObjectId ,
        ref:'Seller' ,
        required:true

    } ,
    quantity:{
        type:Number ,
        required:true ,

    } ,
    deadline:{
        type:Date ,
        required:true ,
    } ,
    description:{
        type:String ,
    } ,
    otherAttributes:[
        {
            name:String ,
            value:String 
        }
    ] ,
    status:{
        type:String ,
        default:'sent' ,
        enum:['sent' , 'in-progess' , 'accepted' ,'rejected'] ,
        required:true
    }

} , {collection:'Quotation' , timestamps:true})

export default mongoose.model('Quotation' , QuotationSchema)
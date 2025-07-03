import mongoose from 'mongoose'


const QuotationSchema = new mongoose.Schema({
       productId:{
           type:mongoose.Types.ObjectId , 
           ref:"Product" , 
           required:true ,
           index:true
       } ,
    buyer:{
        type:mongoose.Types.ObjectId ,
        ref:'Buyer' ,
        required:true  ,
        index:true

    } ,
    seller:{
        type:mongoose.Types.ObjectId ,
        ref:'Seller' ,
        required:true,
        index:true ,

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
    attributes:[
        {
            field:String ,
            value:String 
        }
    ] ,
    status:{
        type:String ,
        default:'pending' ,
        enum:['pending' , 'in-progess' , 'accepted' ,'rejected'] ,
        required:true
    } ,

    minPrice:{
        type:Number ,
        required:true
    } ,
    maxPrice:{
        type:Number ,
        required:true
    } ,

    state:{
        type:String ,
        required:true
    } ,
    pinCode:{
        type:String ,
        required:true
    }  ,

    seen:{
        type:Boolean ,
        default:false ,
        required:true

    }

} , {collection:'Quotation' , timestamps:true})

export default mongoose.model('Quotation' , QuotationSchema)
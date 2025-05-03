import  paginate from "mongoose-paginate-v2";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import mongoose from 'mongoose'

const ChatSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Buyer'
    },
    
   
    
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Seller'
    },
    
  quotation:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Quotation'
    },
    
 
    
}, {timestamps: true, collection: 'Chat'})

export default mongoose.model('Chat', ChatSchema)
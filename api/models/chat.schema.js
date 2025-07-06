import paginate from "mongoose-paginate-v2"; 
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
    
    quotation: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Quotation'
    },
    
    phase: {
        type: String,
        enum: ['negotiation', 'invoice_sent', 'invoice_accepted', 'invoice_rejected', 'order_created', 'completed'],
        default: 'negotiation'
    },
    
    activeInvoice: {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'expired'],
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        respondedAt: {
            type: Date
        } ,
        link:{
            type:String ,
        }
    },
    
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    
    unreadBy: {
        type: String,
        enum: ['buyer', 'seller'],
        default: 'buyer'
    },
    
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    
    lastSeenAt: {
        buyer: {
            type: Date,
            default: null
        },
        seller: {
            type: Date,
            default: null
        }
    }
}, {timestamps: true, collection: 'Chat'})

ChatSchema.plugin(paginate);
ChatSchema.plugin(mongooseAggregatePaginate);

export default mongoose.model('Chat', ChatSchema)
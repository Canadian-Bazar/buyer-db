import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    
    senderModel: {
        type: String,
        required: true,
        enum: ['Buyer', 'Seller']
    },
    
    content: {
        type: String,
        required: true,
    },
    
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    quotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation'
    },
    
    messageType: {
        type: String,
        enum: ['text', 'quotation_created', 'quotation_accepted', 'quotation_rejected' , 'image' , 'link'],
        default: 'text'
    },
    
    isRead: {
        type: Boolean,
        default: false
    } ,


       media: [{
        url: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['image', 'pdf'],
            required: true
        },
        name: String,
        size: Number 
    }],
    status :{
        type:String ,
        enum :['sent' ,'failed']
    }
}, {timestamps: true, collection: 'Message'})

export default mongoose.model('Message', MessageSchema)
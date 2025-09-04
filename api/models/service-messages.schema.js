import mongoose from 'mongoose'

const ServiceMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    
    senderModel: {
        type: String,
        required: true,
        enum: ['Buyer', 'Seller', 'seller', 'buyer']
    },
    
    content: {
        type: String,
        required: true,
    },
    
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceChat',
        required: true
    },
    
    quotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceQuotation'
    },
    
    messageType: {
        type: String,
        enum: ['text', 'quotation_created', 'quotation_accepted', 'quotation_rejected', 'image', 'link', 'service_invoice_created', 'service_invoice_accepted', 'service_invoice_rejected'],
        default: 'text'
    },
    
    isRead: {
        type: Boolean,
        default: false
    },

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
    
    status: {
        type: String,
        enum: ['sent', 'failed', 'delivered'],
        default: 'sent'
    }
}, {timestamps: true, collection: 'ServiceMessage'})

export default mongoose.model('ServiceMessage', ServiceMessageSchema)
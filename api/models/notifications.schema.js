import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const BuyerNotificationSchema = new mongoose.Schema({
    recipient:{
        type: mongoose.Types.ObjectId,
        ref: 'Buyer',
        required: true,
        index: true
    } ,

    sender: {
        model: {
            type: String,
            enum: ['Seller', 'Admin', 'System'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'sender.model',
            required: function() {
                return this.sender.model !== 'System';
            }
        },
        name: {
            type: String,
            required: true
        },
        image: {
            type: String
        }
    },
    type: {
        type: String,
        enum: [
            // Existing types
            'quote_accepted', 'quote_rejected', 'quote_updated', 'admin_message', 'system_alert', 'other', 'negotiation', 'invoice_created', 'service_quote_rejected',
            // New for chat/inbox parity with seller side
            'inbox', 'order', 'invoice', 'inquiry', 'review'
        ],
        required: true,
        index: true
    },

    // Optional title for richer notifications (parity with seller)
    title: {
        type: String,
    },

    message: {
        type: String,
        required: true
    },

    // Reference id to related entity (chat, invoice, quotation, order, review, etc.)
    refId: {
        type: mongoose.Schema.Types.ObjectId,
    },

    // Flexible metadata to attach additional context
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    }
} , { 
    timestamps:true ,
    collection:'BuyerNotifications'
})


BuyerNotificationSchema.plugin(paginate)
BuyerNotificationSchema.plugin(aggregatePaginate)

export default mongoose.model('BuyerNotifications' , BuyerNotificationSchema)
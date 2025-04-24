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
        enum: ['quote_accepted', 'quote_rejected', 'quote_updated', 'admin_message', 'system_alert', 'other'],
        required: true,
        index: true
    },
    
    message: {
        type: String,
        required: true
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
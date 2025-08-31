import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const ServiceOrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    paymentType: {
        type: String,
        enum: ['Cash On Delivery', 'Online'],
        default: 'Online'
    },
    
    serviceQuotationId: {
        type: mongoose.Types.ObjectId,
        ref: 'ServiceQuotation',
        required: true
    },
    
    serviceInvoiceId: {
        type: mongoose.Types.ObjectId,
        ref: 'ServiceInvoice',
        required: true
    },
    
    serviceChatId: {
        type: mongoose.Types.ObjectId,
        ref: 'ServiceChat',
        required: true
    },
    
    finalPrice: {
        type: Number,
        required: true
    },
    
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String
    },

    billingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String
    },
    
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed', 
            'in_progress',
            'review_ready',
            'revision_requested',
            'completed',
            'delivered',
            'cancelled'
        ],
        default: 'pending'
    },
    
    // Service-specific fields
    serviceType: {
        type: String,
        required: true
    },
    
    deliveryMethod: {
        type: String,
        enum: ['digital', 'physical', 'consultation'],
        default: 'digital'
    },
    
    expectedDeliveryDate: {
        type: Date
    },
    
    actualDeliveryDate: {
        type: Date
    },
    
    deliveredAt: {
        type: Date
    },
    
    // Service progress tracking
    milestones: [{
        name: String,
        description: String,
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        },
        completedAt: Date
    }],
    
    // Service deliverables
    deliverables: [{
        name: String,
        description: String,
        fileUrl: String,
        deliveredAt: Date
    }],
    
    // Customer feedback
    feedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: Date
    }
    
}, { 
    timestamps: true, 
    collection: 'ServiceOrders' 
})

ServiceOrderSchema.index({ orderId: 1 }, { unique: true })
ServiceOrderSchema.index({ serviceQuotationId: 1 })


ServiceOrderSchema.plugin(paginate)
ServiceOrderSchema.plugin(aggregatePaginate)

export default mongoose.model('ServiceOrders', ServiceOrderSchema)
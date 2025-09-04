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
            'processing', 
            'ready_to_ship', 
            'shipped', 
            'in_transit', 
            'out_for_delivery', 
            'delivered', 
            'cancelled', 
            'returned'
        ],
        default: 'pending'
    },
    
    trackingNumber: {
        type: String
    },
    
    estimatedDeliveryDate: {
        type: Date
    },
    
    deliveredAt: {
        type: Date
    },
    
    // Service-specific fields
   
    
}, { 
    timestamps: true, 
    collection: 'ServiceOrders' 
})

ServiceOrderSchema.index({ orderId: 1 }, { unique: true })
ServiceOrderSchema.index({ serviceQuotationId: 1 })


ServiceOrderSchema.plugin(paginate)
ServiceOrderSchema.plugin(aggregatePaginate)

export default mongoose.model('ServiceOrders', ServiceOrderSchema)
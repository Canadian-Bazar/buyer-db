import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    

    paymentType:{
        type:String ,
        enum:['Cash On Delivery' , 'Online'] ,
        default:'Cash On Delivery'
    } ,
    quotationId: {
        type: mongoose.Types.ObjectId,
        ref: 'Quotation',
        required: true
    },
    
    invoiceId: {
        type: mongoose.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    
    chatId: {
        type: mongoose.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    finalPrice: {
        type: Number,
        required: true
    },
    
       shippingAddress: {
        street : String ,
        city:String ,
        state:String ,
        postalCode:String



    },


    billingAddress:{
         street : String ,
        city:String ,
        state:String ,
        postalCode:String
    } ,
    
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
    }
}, { 
    timestamps: true, 
    collection: 'Orders' 
})

OrderSchema.index({ orderId: 1 }, { unique: true })
OrderSchema.index({ quotationId: 1 })
OrderSchema.index({ invoiceId: 1 })
OrderSchema.index({ chatId: 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ paymentStatus: 1 })

OrderSchema.plugin(paginate)
OrderSchema.plugin(aggregatePaginate)

export default mongoose.model('Orders', OrderSchema)
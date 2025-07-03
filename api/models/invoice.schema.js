import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    quotationId: {
        type: mongoose.Types.ObjectId,
        ref: 'Quotation',
        required: true
    },
    
    // Link to chat for better tracking
    chatId: {
        type: mongoose.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    sellerId: {
        type: mongoose.Types.ObjectId,
        ref: 'Seller', 
        required: true
    },
    
    // Add buyerId for better tracking
    buyerId: {
        type: mongoose.Types.ObjectId,
        ref: 'Buyer'
    },
    
    negotiatedPrice: {
        type: Number,
        required: true
    },
    
    // Payment and delivery terms
    paymentTerms: {
        type: String,
        default: 'Payment on delivery'
    },
    
    deliveryTerms: {
        type: String,
        default: 'Standard delivery'
    },
    
    // Additional details
    taxAmount: {
        type: Number,
        default: 0
    },
    
    shippingCharges: {
        type: Number,
        default: 0
    },
    
    totalAmount: {
        type: Number,
        required: true
    },
    
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
    },
    
    viewedByBuyer: {
        type: Boolean,
        default: false
    },
    
    viewedAt: {
        type: Date
    },
    
    acceptedAt: {
        type: Date,
        default: null
    },
    
    rejectedAt: {
        type: Date,
        default: null
    },
    
    rejectionReason: {
        type: String,
        default: null
    },
    
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) 
    },
    
    notes: {
        type: String
    }
}, { 
    timestamps: true, 
    collection: 'Invoice' 
});

InvoiceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
InvoiceSchema.index({ quotationId: 1 });
InvoiceSchema.index({ sellerId: 1 });
InvoiceSchema.index({ buyerId: 1 });
InvoiceSchema.index({ chatId: 1 });
InvoiceSchema.index({ status: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
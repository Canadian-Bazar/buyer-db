import mongoose from 'mongoose';

const LineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: '' },
    productId: { type: mongoose.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
)

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
    
    items: { type: [LineItemSchema], default: [] },

    negotiatedPrice: { type: Number, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingCharges: { type: Number, default: 0, min: 0 },
    additionalFees: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    
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
    
    expiresAt: { type: Date },
    
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
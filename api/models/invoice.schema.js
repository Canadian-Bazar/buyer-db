import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
    quotationId: {
        type: mongoose.Types.ObjectId,
        ref: 'Quotation',
        required: true
    },
    sellerId: {
        type: mongoose.Types.ObjectId,
        ref: 'Seller', 
        required: true
    },

    negotiatedPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
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
    }
}, { 
    timestamps: true, 
    collection: 'Invoice' 
});

InvoiceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

InvoiceSchema.index({ quotationId: 1 });
InvoiceSchema.index({ sellerId: 1 });
InvoiceSchema.index({ buyerId: 1 });
InvoiceSchema.index({ status: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
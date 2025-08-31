import mongoose from 'mongoose';

const ServiceInvoiceSchema = new mongoose.Schema({
    quotationId: {
        type: mongoose.Types.ObjectId,
        ref: 'ServiceQuotation',
        required: true
    },
    sellerId: {
        type: mongoose.Types.ObjectId,
        ref: 'Seller', 
        required: true
    },
    buyer: {
        type: mongoose.Types.ObjectId,
        ref: 'Buyer',
        required: true
    },
    chatId: {
        type: mongoose.Types.ObjectId,
        ref: 'ServiceChat',
        required: true
    },
    negotiatedPrice: {
        type: Number,
        required: true
    },

    totalAmount: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: null
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
    viewedByBuyer: {
        type: Boolean,
        default: false
    },
    viewedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    }
}, { 
    timestamps: true, 
    collection: 'ServiceInvoice' 
});

ServiceInvoiceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

ServiceInvoiceSchema.index({ quotationId: 1 });
ServiceInvoiceSchema.index({ sellerId: 1 });
ServiceInvoiceSchema.index({ buyer: 1 });
ServiceInvoiceSchema.index({ chatId: 1 });
ServiceInvoiceSchema.index({ status: 1 });

export default mongoose.model('ServiceInvoice', ServiceInvoiceSchema);
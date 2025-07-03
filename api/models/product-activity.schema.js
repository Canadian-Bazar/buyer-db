import mongoose from "mongoose";

const ProductActivityLogSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Types.ObjectId,
    index: true
  },
  activityType: {
    type: String,
    enum: ['view', 'sent', 'accepted', 'rejected', 'in-progress', 'sold'], 
    required: true,
    index: true
  },
  quotationId: {
    type: mongoose.Types.ObjectId,
    ref: 'Quotation',
    sparse: true
  },
  saleAmount: {
    type: Number,
    sparse: true 
  },
  profit: {
    type: Number,
    sparse: true 
  },
  isProcessed: {
    type: Boolean,
    default: false,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'ProductActivityLog'
});

ProductActivityLogSchema.index({ activityType: 1, isProcessed: 1, createdAt: 1 });
ProductActivityLogSchema.index({ productId: 1, activityType: 1, createdAt: 1 });
ProductActivityLogSchema.index({ timestamp: 1, activityType: 1 });

export default mongoose.model('ProductActivityLog', ProductActivityLogSchema);
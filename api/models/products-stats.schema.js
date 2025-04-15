import mongoose from 'mongoose';

const ProductStatsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  quotationCount: {
    type: Number,
    default: 0
  },
  acceptedQuotationCount: {
    type: Number,
    default: 0
  },
  rejectedQuotationCount: {
    type: Number,
    default: 0
  },
  inProgressQuotationCount: {
    type: Number,
    default: 0
  },
  popularityScore: {
    type: Number,
    default: 0,
    index: true
  },
  bestsellerScore: {
    type: Number,
    default: 0,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true, 
  collection: 'ProductStats' 
});

ProductStatsSchema.index({ productId: 1 }, { unique: true });

export default mongoose.model('ProductStats', ProductStatsSchema);
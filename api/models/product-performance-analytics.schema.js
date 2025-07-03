import mongoose from 'mongoose';

// Daily metrics subdocument for performance tracking
const DailyPerformanceMetricsSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // 1-31
  viewCount: { type: Number, default: 0 },
  quotationsSent: { type: Number, default: 0 },
  quotationsAccepted: { type: Number, default: 0 },
  quotationsRejected: { type: Number, default: 0 },
  quotationsInProgress: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  bestsellerScore: { type: Number, default: 0 }
}, { _id: false });

// Weekly metrics subdocument for performance tracking
const WeeklyPerformanceMetricsSchema = new mongoose.Schema({
  week: { type: Number, required: true }, // 1-53 (week of year)
  viewCount: { type: Number, default: 0 },
  quotationsSent: { type: Number, default: 0 },
  quotationsAccepted: { type: Number, default: 0 },
  quotationsRejected: { type: Number, default: 0 },
  quotationsInProgress: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  bestsellerScore: { type: Number, default: 0 }
}, { _id: false });

// Monthly metrics subdocument for performance tracking
const MonthlyPerformanceMetricsSchema = new mongoose.Schema({
  month: { type: Number, required: true }, // 1-12
  viewCount: { type: Number, default: 0 },
  quotationsSent: { type: Number, default: 0 },
  quotationsAccepted: { type: Number, default: 0 },
  quotationsRejected: { type: Number, default: 0 },
  quotationsInProgress: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  bestsellerScore: { type: Number, default: 0 }
}, { _id: false });

// =============================================================================
// MONTHLY PERFORMANCE ANALYTICS - ONLY PERFORMANCE DATA
// =============================================================================
const ProductMonthlyPerformanceSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  
  year: {
    type: Number,
    required: true,
    index: true
  },
  
  month: {
    type: Number,
    required: true,
    index: true // 1-12
  },
  
  // Arrays of ONLY performance data
  dailyMetrics: [DailyPerformanceMetricsSchema],    // Max 31 elements
  weeklyMetrics: [WeeklyPerformanceMetricsSchema],  // Max 6 elements per month
  
  // Monthly totals - ONLY performance data
  monthlyTotals: {
    viewCount: { type: Number, default: 0 },
    quotationsSent: { type: Number, default: 0 },
    quotationsAccepted: { type: Number, default: 0 },
    quotationsRejected: { type: Number, default: 0 },
    quotationsInProgress: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    bestsellerScore: { type: Number, default: 0 }
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'ProductMonthlyPerformance'
});

// Compound indices for efficient querying
ProductMonthlyPerformanceSchema.index({ 
  productId: 1, 
  year: 1, 
  month: 1 
}, { unique: true });

ProductMonthlyPerformanceSchema.index({ year: 1, month: 1 });
ProductMonthlyPerformanceSchema.index({ productId: 1, year: 1 });

// =============================================================================
// YEARLY PERFORMANCE ANALYTICS - ONLY PERFORMANCE DATA
// =============================================================================
const ProductYearlyPerformanceSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  
  year: {
    type: Number,
    required: true,
    index: true
  },
  
  // Array of monthly metrics - ONLY performance data
  monthlyMetrics: [MonthlyPerformanceMetricsSchema], // Max 12 elements
  
  // Yearly totals - ONLY performance data
  yearlyTotals: {
    viewCount: { type: Number, default: 0 },
    quotationsSent: { type: Number, default: 0 },
    quotationsAccepted: { type: Number, default: 0 },
    quotationsRejected: { type: Number, default: 0 },
    quotationsInProgress: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
    bestsellerScore: { type: Number, default: 0 }
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'ProductYearlyPerformance'
});

ProductYearlyPerformanceSchema.index({ 
  productId: 1, 
  year: 1 
}, { unique: true });

ProductYearlyPerformanceSchema.index({ year: 1 });

export const ProductMonthlyPerformance = mongoose.model('ProductMonthlyPerformance', ProductMonthlyPerformanceSchema);
export const ProductYearlyPerformance = mongoose.model('ProductYearlyPerformance', ProductYearlyPerformanceSchema);
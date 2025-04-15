import mongoose from 'mongoose'


const CategoryStatsSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true,
        unique: true
    },
    viewCount: { type: Number, default: 0 },
    searchCount: { type: Number, default: 0 },
    
   
    weeklyViews: { type: Number, default: 0 },
    weeklySearches: { type: Number, default: 0 },
    
    dailyViews: { type: Number, default: 0 },
    dailySearches: { type: Number, default: 0 },
    
    popularityScore: { type: Number, default: 0 },
    
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true , collection:'CategoryStats' });

CategoryStatsSchema.index({ popularityScore: -1 });


export default mongoose.model('CategoryStats' , CategoryStatsSchema)
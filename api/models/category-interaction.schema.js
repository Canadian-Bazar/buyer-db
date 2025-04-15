import mongoose from 'mongoose'


const CategoryInteractionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    categoryId: {
        type: mongoose.Types.ObjectId,
        ref: "Category",
        required: true
    },
    viewCount: { type: Number, default: 0 },
    searchCount: { type: Number, default: 0 },
    lastInteracted: { type: Date, default: Date.now },
    
    // TTL field for auto-expiration
    expiresAt: { 
        type: Date, 
        default: function() {
            return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); 
        }
    }
}, { timestamps: true  , collection:'CategoryInteraction'});

// Compound index for queries and uniqueness
CategoryInteractionSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

// TTL index for auto-cleanup
CategoryInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export default mongoose.model('CategoryInteraction' , CategoryInteractionSchema)
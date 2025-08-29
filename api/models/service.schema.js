import mongoose from 'mongoose'

const ServiceSchema = new mongoose.Schema({


   slug:{
        type:String ,
        trim:true ,
        index:true ,
    } ,




    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sellers',
        required: true
    },

    name: { 
        type: String, 
        required: true 
    },
    description: {
        type: String,
        required: true
    },

    isComplete: { 
        type: Boolean, 
        default: false,
        index: true
    },
    
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    incompleteSteps: [{
        type: String,
        enum: ['serviceInfo', 'capabilities', 'order', 'media']
    }],
    
    stepStatus: {
        serviceInfo: { type: Boolean, default: false },     
        capabilities: { type: Boolean, default: false },  
        order: { type: Boolean, default: false },     
        pricing: { type: Boolean, default: false },        
        customization: { type: Boolean, default: false },  
        media: { type: Boolean, default: false }           
    },

    category:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:'Category' ,
        required:true
    } ,



    isBlocked:{
        type: Boolean,
        default: false,
        index: true
    } ,

    isArchived:{
        type: Boolean,
        default: false,
        index: true
    } ,

   

}, { timestamps: true, collection: "Service" });

ServiceSchema.index({ name: 'text' });
ServiceSchema.index({ isVerified: 1 });
ServiceSchema.index({ avgRating: -1 });
ServiceSchema.index({ serviceType: 1 });



ServiceSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        return next();
    }
    
    const baseSlug = this.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    
    try {
        let slug = baseSlug;
        let count = 0;
        let existingService;
        
        do {
            if (count > 0) {
                slug = `${baseSlug}-${count}`;
            }
            
            existingService = await mongoose.models.Service.findOne({ 
                slug,
                _id: { $ne: this._id } // Exclude current document
            });
            count++;
        } while (existingService);
        
        this.slug = slug;
        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model('Service', ServiceSchema)
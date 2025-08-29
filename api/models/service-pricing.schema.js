import mongoose from "mongoose";

const ServicePricingSchema = new mongoose.Schema({
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },

    perModelPrice: {type:Number  , default:null},
    perHourPrice: {type:Number , default:null}, 
    perBatchPrice: {type:Number , default:null},
    volume: {type:Number , default:null},
    customQuoteEnabled: {type:Boolean , default:false}

}, { 
    collection: 'ServicePricing', 
    timestamps: true 
});

export default mongoose.model('ServicePricing', ServicePricingSchema);
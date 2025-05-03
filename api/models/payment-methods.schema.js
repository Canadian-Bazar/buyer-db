import mongoose from 'mongoose';



const PaymentMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
 
    isActive: {
        type: Boolean,
        default: true
    } ,
    imageUrl:{
        type:String
    }
}, { timestamps: true, collection: 'PaymentMethod' })

export default mongoose.model('PaymentMethod', PaymentMethodSchema)
import mongoose from 'mongoose'


const LanguageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true, collection: 'Language' })


export default mongoose.model('Language', LanguageSchema)
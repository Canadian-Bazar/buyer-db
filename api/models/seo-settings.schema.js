import mongoose from 'mongoose'

const SeoSettingsSchema = new mongoose.Schema(
  {
    // Path of the page where this SEO code should be injected in <head>
    path: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    // Raw HTML snippet to be injected inside the <head> tag
    code: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'SeoSettings',
    versionKey: false,
  },
)

export default mongoose.model('SeoSettings', SeoSettingsSchema)



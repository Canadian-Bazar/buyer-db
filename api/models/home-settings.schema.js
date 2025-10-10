import mongoose from 'mongoose'

const HomeSettingsSchema = new mongoose.Schema({
  backgroundImage: { type: String, default: '' },
  mainHeadingBuy: { type: String, default: '' },
  mainHeadingCanadian: { type: String, default: '' },
  subHeadingPart1: { type: String, default: '' },
  subHeadingPart2: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { collection: 'HomeSettings', timestamps: true })

export default mongoose.model('HomeSettings', HomeSettingsSchema)



import mongoose from 'mongoose'

const globalParagraphSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

globalParagraphSchema.index({ path: 1 })
globalParagraphSchema.index({ isActive: 1 })

export default mongoose.model('GlobalParagraph', globalParagraphSchema)


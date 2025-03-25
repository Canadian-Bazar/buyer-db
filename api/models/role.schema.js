import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'

const RolesSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, index: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'Roles',
  }
)

RolesSchema.plugin(paginate)

export default mongoose.model('Roles', RolesSchema)
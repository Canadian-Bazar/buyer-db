import mongoose from 'mongoose'

const BuyerAddressSchema = new mongoose.Schema({
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Buyer',
    required: true,
    index: true
  },
  addressType: { 
    type: String, 
    required: true, 
    enum: ['Billing', 'Shipping'],
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  street: {
    type: String,
    required: true
  },
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    required: true 
  },
  postalCode: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true, 
    default: 'Canada' 
  }
}, {
  collection: 'BuyerAddresses',
  timestamps: true
});

BuyerAddressSchema.index({ buyerId: 1, addressType: 1, isDefault: 1 });

BuyerAddressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { 
        buyerId: this.buyerId, 
        addressType: this.addressType, 
        isDefault: true,
        _id: { $ne: this._id } 
      },
      { isDefault: false }
    );
  }
  next();
});

export default mongoose.model('BuyerAddress', BuyerAddressSchema);
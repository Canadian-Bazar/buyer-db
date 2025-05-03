import mongoose from 'mongoose';
import aggregatePaginateimport  from 'mongoose-aggregate-paginate-v2';
import  paginate  from 'mongoose-paginate-v2';


const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  buyerId: {
    type: mongoose.Types.ObjectId,
    ref: 'Buyer',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer'],
    required: true
  },
  shippingAddress: {
    type: String,
    required: true
  },
}, { timestamps: true, collection: 'Order' });


export default mongoose.model('Order', OrderSchema);

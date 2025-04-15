import mongoose from 'mongoose'


const AddressSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    entityType: { type: String, required: true  , enum:['Seller' ,'Buyer']},
    addressType: { type: String, required: true , enum:['Billing' , 'Shipping'] },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true , default:'Canada' },
    
  } ,{
    collection:'Address' ,
    timestamps:true
  });

  export default mongoose.model('Address' ,AddressSchema ) 
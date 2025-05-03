import mongoose from "mongoose";

const CurrencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
    },
    symbol: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "Currency" }
);


export default mongoose.model("Currency", CurrencySchema);
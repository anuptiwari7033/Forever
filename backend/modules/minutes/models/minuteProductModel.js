import mongoose from "mongoose";

const minuteProductSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "minuteStore",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g. "500 g", "1 L", "pack of 6"
    category: { type: String, required: true },
    stock: { type: Number, default: 100 },
    isAvailable: { type: Boolean, default: true },
    date: { type: Number, default: () => Date.now() },
  },
  { minimize: false }
);

const minuteProductModel =
  mongoose.models.minuteProduct || mongoose.model("minuteProduct", minuteProductSchema);
export default minuteProductModel;

import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ["flat", "percent"], default: "flat" },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  expiry: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  date: { type: Number, default: () => Date.now() },
});

const couponModel = mongoose.models.minuteCoupon || mongoose.model("minuteCoupon", couponSchema);
export default couponModel;

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Vegetables & Fruits"
  // Section header this category is shown under, e.g. "Grocery & Kitchen",
  // "Snacks & Drinks", "Beauty & Personal Care", "Household Essentials".
  group: { type: String, required: true, default: "Other" },
  image: { type: String, required: true },
  date: { type: Number, default: () => Date.now() },
});

const minuteCategoryModel =
  mongoose.models.minuteCategory || mongoose.model("minuteCategory", categorySchema);
export default minuteCategoryModel;

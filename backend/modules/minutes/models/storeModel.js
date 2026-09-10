import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    address: { type: String, required: true },
    contactNumber: { type: String, default: "" },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isOpen: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5 },
    prepTimeMinutes: { type: Number, default: 10 },
    // How far (in km) this store is willing to deliver. Customers outside
    // this radius simply won't see the store in "nearby stores".
    radiusKm: { type: Number, default: 5 },
    date: { type: Number, default: () => Date.now() },
  },
  { minimize: false }
);

const storeModel = mongoose.models.minuteStore || mongoose.model("minuteStore", storeSchema);
export default storeModel;

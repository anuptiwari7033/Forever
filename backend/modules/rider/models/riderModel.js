import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Rider picks their store at signup — they only ever get order offers
    // for this store, and this store's dashboard only ever sees this rider.
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "minuteStore",
      required: true,
    },
    vehicleType: { type: String, default: "bike" },
    vehicleNumber: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    status: {
      type: String,
      enum: ["online", "offline", "on_delivery"],
      default: "offline",
    },

    // Current live location, updated in place (NOT a growing array) so we
    // never write a new document per GPS tick.
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Number, default: null },
    },

    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "minuteOrder",
      default: null,
    },

    isApproved: { type: Boolean, default: true },
    rating: { type: Number, default: 5 },
    totalDeliveries: { type: Number, default: 0 },
    date: { type: Number, default: () => Date.now() },
  },
  { minimize: false }
);

const riderModel = mongoose.models.rider || mongoose.model("rider", riderSchema);
export default riderModel;

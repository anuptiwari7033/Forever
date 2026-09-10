import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  label: { type: String, default: "Home" }, // Home, Work, Other — "type of address"

  // Flat/House/building name — kept separate from `area` so the address
  // details form can show them as two distinct fields.
  houseNumber: { type: String, default: "" },
  area: { type: String, default: "" }, // reverse-geocoded locality text

  // Full human-readable address — always `${houseNumber}, ${area}` when
  // built through the new Add Address flow.
  addressLine: { type: String, required: true },

  contactName: { type: String, default: "" },
  phone: { type: String, default: "" },
  alternatePhone: { type: String, default: "" },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  isDefault: { type: Boolean, default: false },
  date: { type: Number, default: () => Date.now() },
});

const addressModel =
  mongoose.models.minuteAddress || mongoose.model("minuteAddress", addressSchema);
export default addressModel;

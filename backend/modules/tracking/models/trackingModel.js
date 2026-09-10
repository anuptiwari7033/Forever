import mongoose from "mongoose";

// IMPORTANT: we deliberately do NOT persist a GPS point on every
// `location-update` socket event (that would be a write every second per
// active order). We only persist meaningful checkpoints, and we keep the
// rider's *current* live location on the order document itself (see
// minuteOrderModel.js -> currentRiderLocation), which is updated in place
// rather than appended.
const trackingCheckpointSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "minuteOrder",
    required: true,
  },
  event: {
    type: String,
    required: true,
    // e.g. accepted, arrived_at_store, picked_up, out_for_delivery,
    // arrived_at_customer, delivered
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  note: {
    type: String,
    default: "",
  },
  date: {
    type: Number,
    required: true,
    default: () => Date.now(),
  },
});

const trackingModel =
  mongoose.models.trackingCheckpoint ||
  mongoose.model("trackingCheckpoint", trackingCheckpointSchema);

export default trackingModel;

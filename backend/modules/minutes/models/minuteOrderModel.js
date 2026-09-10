import mongoose from "mongoose";

const minuteOrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "minuteStore",
      required: true,
    },

    items: {
      // [{ productId, name, price, quantity }]
      type: Array,
      required: true,
    },

    amount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 15 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },

    address: {
      addressLine: { type: String, required: true },
      location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },

    storeLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    paymentMethod: { type: String, required: true }, // COD | ONLINE | WALLET
    payment: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "placed",
        "searching_rider",
        "accepted",
        "rejected",
        "arrived_at_store",
        "picked_up",
        "out_for_delivery",
        "arrived_at_customer",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rider",
      default: null,
    },

    // True once the rider has tapped "Accept" — while false and riderId is
    // set, the order is only *offered* to that rider (status stays
    // searching_rider) and can still be reassigned if they reject/time out.
    riderAccepted: { type: Boolean, default: false },

    // Set by the store's own dashboard once they've physically packed the
    // order — independent of the rider's own status steps, since packing
    // can happen while the rider is still on the way to the store.
    packedByStore: { type: Boolean, default: false },

    // Updated IN PLACE on every location-update socket event.
    // This is intentionally the only place we store "live" GPS data —
    // history/checkpoints live in trackingModel instead.
    currentRiderLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Number, default: null },
    },

    distanceRemainingKm: { type: Number, default: null },
    etaMinutes: { type: Number, default: null },

    riderRejections: {
      // riderIds that rejected this order, so we don't re-offer it to them
      type: [String],
      default: [],
    },

    pendingOfferRiderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rider",
      default: null,
    },

    date: { type: Number, required: true, default: () => Date.now() },
    deliveredAt: { type: Number, default: null },
  },
  { minimize: false }
);

const minuteOrderModel =
  mongoose.models.minuteOrder || mongoose.model("minuteOrder", minuteOrderSchema);

export default minuteOrderModel;

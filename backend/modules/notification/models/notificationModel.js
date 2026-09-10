import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ["customer", "rider", "store"], required: true },
  recipientId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "order" }, // order | promo | system
  orderId: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  date: { type: Number, default: () => Date.now() },
});

const notificationModel =
  mongoose.models.notification || mongoose.model("notification", notificationSchema);
export default notificationModel;

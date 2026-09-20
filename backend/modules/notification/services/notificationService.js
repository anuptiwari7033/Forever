import notificationModel from "../models/notificationModel.js";
import { getIO } from "../../../socket/ioInstance.js";

// Persists a notification and (best-effort) pushes it live over the socket
// room for that customer/rider. Socket delivery failing should never break
// the calling flow (e.g. order placement), so it's wrapped defensively.
export const sendNotification = async ({
  recipientType,
  recipientId,
  title,
  message,
  type = "order",
  orderId = null,
}) => {
  const notification = await notificationModel.create({
    recipientType,
    recipientId,
    title,
    message,
    type,
    orderId,
  });

  try {
    const io = getIO();
    const room =
      recipientType === "rider"
        ? `rider:${recipientId}`
        : recipientType === "store"
        ? `store:${recipientId}`
        : `customer:${recipientId}`;
    io.to(room).emit("notification", notification);
  } catch (e) {
    // Socket may not be initialized (e.g. during tests) — safe to ignore.
  }

  return notification;
};

export default { sendNotification };

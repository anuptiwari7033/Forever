import {
  acceptOrder,
  rejectOrder,
  markArrivedAtStore,
  pickupOrder,
  markDelivered,
  updateRiderLiveLocation,
} from "../../minutes/services/minuteOrderService.js";
import { TRACKING_EVENTS } from "../../../constants/orderStatus.js";

// Registers all Forever Minutes tracking events on a connected socket.
// Called once per socket from socket/index.js.
const registerTrackingSocket = (io, socket) => {
  socket.on(TRACKING_EVENTS.JOIN_ORDER, ({ orderId }) => {
    if (!orderId) return;
    socket.join(`order:${orderId}`);
  });

  socket.on(TRACKING_EVENTS.LEAVE_ORDER, ({ orderId }) => {
    if (!orderId) return;
    socket.leave(`order:${orderId}`);
  });

  // Emitted by the rider app on every navigator.geolocation.watchPosition tick.
  socket.on(TRACKING_EVENTS.LOCATION_UPDATE, async ({ orderId, riderId, lat, lng }) => {
    try {
      await updateRiderLiveLocation({ orderId, riderId, lat, lng });
    } catch (e) {
      socket.emit("error", { message: e.message });
    }
  });

  socket.on(TRACKING_EVENTS.ACCEPT_ORDER, async ({ orderId, riderId }) => {
    try {
      const order = await acceptOrder(orderId, riderId);
      socket.emit(TRACKING_EVENTS.ACCEPT_ORDER, { success: true, order });
    } catch (e) {
      socket.emit(TRACKING_EVENTS.ACCEPT_ORDER, { success: false, message: e.message });
    }
  });

  socket.on("reject-order", async ({ orderId, riderId }) => {
    try {
      const order = await rejectOrder(orderId, riderId);
      socket.emit("reject-order", { success: true, order });
    } catch (e) {
      socket.emit("reject-order", { success: false, message: e.message });
    }
  });

  socket.on("arrived-at-store", async ({ orderId, riderId }) => {
    try {
      const order = await markArrivedAtStore(orderId, riderId);
      socket.emit("arrived-at-store", { success: true, order });
    } catch (e) {
      socket.emit("arrived-at-store", { success: false, message: e.message });
    }
  });

  socket.on(TRACKING_EVENTS.PICKUP_ORDER, async ({ orderId, riderId }) => {
    try {
      const order = await pickupOrder(orderId, riderId);
      socket.emit(TRACKING_EVENTS.PICKUP_ORDER, { success: true, order });
    } catch (e) {
      socket.emit(TRACKING_EVENTS.PICKUP_ORDER, { success: false, message: e.message });
    }
  });

  socket.on(TRACKING_EVENTS.DELIVERED_ORDER, async ({ orderId, riderId }) => {
    try {
      const order = await markDelivered(orderId, riderId);
      socket.emit(TRACKING_EVENTS.DELIVERED_ORDER, { success: true, order });
    } catch (e) {
      socket.emit(TRACKING_EVENTS.DELIVERED_ORDER, { success: false, message: e.message });
    }
  });
};

export default registerTrackingSocket;

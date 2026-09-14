import minuteOrderModel from "../models/minuteOrderModel.js";
import riderModel from "../../rider/models/riderModel.js";
import trackingModel from "../../tracking/models/trackingModel.js";
import { findNearestRider, getDistanceKm, getEtaMinutes, hasArrived } from "../../tracking/services/geoService.js";
import { sendNotification } from "../../notification/services/notificationService.js";
import { getIO } from "../../../socket/ioInstance.js";
import { MINUTE_ORDER_STATUS, RIDER_STATUS, TRACKING_EVENTS } from "../../../constants/orderStatus.js";
import * as minuteOrderQueue from "../queue/minuteOrderQueue.js";


const emitToOrderRoom = (orderId, event, payload) => {
  try {
    getIO().to(`order:${orderId}`).emit(event, payload);
  } catch (e) {
    // Socket not initialized (e.g. running a one-off script) — safe to skip.
  }
};

const emitToStoreRoom = (storeId, event, payload) => {
  try {
    getIO().to(`store:${storeId}`).emit(event, payload);
  } catch (e) {}
};

const emitToRiderRoom = (riderId, event, payload) => {
  try {
    getIO().to(`rider:${riderId}`).emit(event, payload);
  } catch (e) {}
};

const notifyEligibleRiders = async (storeId, excludeRiderId, event, payload) => {
  const riderFilter = {
    storeId,
    status: { $in: [RIDER_STATUS.ONLINE, RIDER_STATUS.ON_DELIVERY] },
  };

  if (excludeRiderId) {
    riderFilter._id = { $ne: excludeRiderId };
  }

  const riders = await riderModel.find(riderFilter);
  riders.forEach((rider) => emitToRiderRoom(rider._id.toString(), event, payload));
};

// Assign the earliest waiting order from this store to the nearest online rider.
// If no online rider exists, the order remains in the BullMQ queue.
const assignOrderToNearestRider = async (storeId) => {
  return minuteOrderQueue.assignNextStoreOrder(storeId);
};

export const placeOrder = async (orderData) => {
  const order = await minuteOrderModel.create({
    ...orderData,
    status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
  });

  // The store should know about a new order the moment it's placed —
  // independent of whether a rider has been found yet.
  emitToStoreRoom(order.storeId.toString(), TRACKING_EVENTS.NEW_ORDER, order);
  await sendNotification({
    recipientType: "store",
    recipientId: order.storeId.toString(),
    title: "New order — please pack it",
    message: `New order with ${order.items.length} item(s). Please start packing.`,
    orderId: order._id.toString(),
  });

  await minuteOrderQueue.addOrderToQueue(order._id, order.storeId);
  await assignOrderToNearestRider(order.storeId);

  return order;
};

export const acceptOrder = async (orderId, riderId) => {
  const rider = await riderModel.findById(riderId);
  if (!rider) {
    throw new Error("Rider not found");
  }

  if (rider.status === RIDER_STATUS.ON_DELIVERY && rider.currentOrderId) {
    throw new Error("Finish your current delivery before accepting a new order");
  }

  const order = await minuteOrderModel.findOneAndUpdate(
    {
      _id: orderId,
      status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
      riderAccepted: false,
      riderId: null,
      pendingOfferRiderId: riderId,
      riderRejections: { $nin: [riderId] },
    },
    {
      status: MINUTE_ORDER_STATUS.ACCEPTED,
      riderAccepted: true,
      riderId,
      pendingOfferRiderId: null,
    },
    { new: true }
  );
  if (!order) {
    throw new Error("This order is no longer offered to you");
  }

  await riderModel.findByIdAndUpdate(
    riderId,
    { status: RIDER_STATUS.ON_DELIVERY, currentOrderId: order._id },
    { new: true }
  );

  await minuteOrderQueue.removeOrderFromQueue(order._id, order.storeId);

  await trackingModel.create({
    orderId: order._id,
    event: MINUTE_ORDER_STATUS.ACCEPTED,
    location: order.storeLocation,
  });

  const populatedOrder = await minuteOrderModel
    .findById(order._id)
    .populate("riderId", "name phone vehicleType rating status");

  emitToOrderRoom(orderId, "order-status-update", populatedOrder);
  emitToStoreRoom(order.storeId.toString(), "order-status-update", populatedOrder);
  await notifyEligibleRiders(order.storeId, riderId, "order-status-update", populatedOrder);

  await sendNotification({
    recipientType: "customer",
    recipientId: order.userId,
    title: "Rider assigned",
    message: "A rider has accepted your order and is heading to the store.",
    orderId,
  });

  return populatedOrder;
};

export const rejectOrder = async (orderId, riderId) => {
  const order = await minuteOrderModel.findOneAndUpdate(
    {
      _id: orderId,
      status: MINUTE_ORDER_STATUS.SEARCHING_RIDER,
      riderAccepted: false,
      pendingOfferRiderId: riderId,
    },
    {
      $addToSet: { riderRejections: riderId },
      pendingOfferRiderId: null,
    },
    { new: true }
  );

  if (!order) {
    throw new Error("Order can no longer be rejected");
  }

  emitToOrderRoom(orderId, TRACKING_EVENTS.REJECT_ORDER, { orderId, riderId });
  emitToStoreRoom(order.storeId.toString(), "order-status-update", order);

  // Put the declined order back into the store's BullMQ queue so the worker
  // offers it to the next-nearest online rider (or keeps it waiting if none). (req 8)
  if (order.status === MINUTE_ORDER_STATUS.SEARCHING_RIDER) {
    await minuteOrderQueue.addOrderToQueue(order._id, order.storeId);
    await assignOrderToNearestRider(order.storeId);
  }

  return order;
};

export const markArrivedAtStore = async (orderId, riderId) => {
  const order = await minuteOrderModel.findOneAndUpdate(
    { _id: orderId, riderId },
    { status: MINUTE_ORDER_STATUS.ARRIVED_AT_STORE },
    { new: true }
  );
  if (!order) throw new Error("Order not found or not assigned to you");

  await trackingModel.create({
    orderId,
    event: MINUTE_ORDER_STATUS.ARRIVED_AT_STORE,
    location: order.storeLocation,
  });

  emitToOrderRoom(orderId, "order-status-update", order);
  return order;
};

export const pickupOrder = async (orderId, riderId) => {
  const order = await minuteOrderModel.findOneAndUpdate(
    { _id: orderId, riderId },
    { status: MINUTE_ORDER_STATUS.OUT_FOR_DELIVERY },
    { new: true }
  );
  if (!order) throw new Error("Order not found or not assigned to you");

  await trackingModel.create({
    orderId,
    event: MINUTE_ORDER_STATUS.PICKED_UP,
    location: order.storeLocation,
  });

  // emitToOrderRoom(orderId, TRACKING_EVENTS.PICKUP_ORDER, order);
  emitToOrderRoom(orderId, "order-status-update", order);
  await sendNotification({
    recipientType: "customer",
    recipientId: order.userId,
    title: "Order picked up",
    message: "Your order has been picked up and is on the way!",
    orderId,
  });

  return order;
};

export const markDelivered = async (orderId, riderId) => {
  const order = await minuteOrderModel.findOneAndUpdate(
    { _id: orderId, riderId },
    { status: MINUTE_ORDER_STATUS.DELIVERED, deliveredAt: Date.now(), payment: true },
    { new: true }
  );
  if (!order) throw new Error("Order not found or not assigned to you");

  await trackingModel.create({
    orderId,
    event: MINUTE_ORDER_STATUS.DELIVERED,
    location: order.address.location,
  });

  await riderModel.findByIdAndUpdate(riderId, {
    status: RIDER_STATUS.ONLINE,
    currentOrderId: null,
    $inc: { totalDeliveries: 1 },
  });

  emitToOrderRoom(orderId, "order-status-update", order);
  emitToStoreRoom(order.storeId.toString(), "order-status-update", order);

  await sendNotification({
    recipientType: "customer",
    recipientId: order.userId,
    title: "Order delivered",
    message: "Your order has been delivered. Enjoy!",
    orderId,
  });

  // Rider is free again — wake this store's queue so the next waiting order
  // gets offered to them right away.                                          (req 7)
  await assignOrderToNearestRider(order.storeId);

  return order;
};

// Called on every `location-update` socket event. Deliberately does NOT
// write to Mongo on every tick beyond a single in-place field update on the
// order (no history array growth) — see minuteOrderModel.currentRiderLocation.
export const updateRiderLiveLocation = async ({ orderId, riderId, lat, lng }) => {
  const order = await minuteOrderModel.findById(orderId);
  if (!order) return null;

  const riderLocation = { lat, lng };

  const target =
    order.status === MINUTE_ORDER_STATUS.OUT_FOR_DELIVERY ||
    order.status === MINUTE_ORDER_STATUS.ARRIVED_AT_CUSTOMER
      ? order.address.location
      : order.storeLocation;

  const distanceKm = getDistanceKm(riderLocation, target);
  const etaMinutes = getEtaMinutes(distanceKm);
  const arrived = hasArrived(riderLocation, target);

  order.currentRiderLocation = { lat, lng, updatedAt: Date.now() };
  order.distanceRemainingKm = Number(distanceKm.toFixed(2));
  order.etaMinutes = etaMinutes;

  let justArrivedAtCustomer = false;
  if (
    arrived &&
    order.status === MINUTE_ORDER_STATUS.OUT_FOR_DELIVERY
  ) {
    order.status = MINUTE_ORDER_STATUS.ARRIVED_AT_CUSTOMER;
    justArrivedAtCustomer = true;
  }

  await order.save();

  await riderModel.findByIdAndUpdate(riderId, {
    location: { lat, lng, updatedAt: Date.now() },
  });

  if (justArrivedAtCustomer) {
    await trackingModel.create({
      orderId,
      event: MINUTE_ORDER_STATUS.ARRIVED_AT_CUSTOMER,
      location: riderLocation,
    });
    emitToOrderRoom(orderId, TRACKING_EVENTS.ARRIVED_AT_CUSTOMER, {
      orderId,
      message: "I am at this location",
    });
  }

  const payload = {
    orderId,
    riderLocation,
    distanceRemainingKm: order.distanceRemainingKm,
    etaMinutes: order.etaMinutes,
    status: order.status,
  };

  emitToOrderRoom(orderId, TRACKING_EVENTS.LOCATION_UPDATE, payload);

  return payload;
};

export const getOrderById = (orderId) => minuteOrderModel.findById(orderId);

// Store marks an order as packed and ready — independent of the rider's
// own accept/pickup steps, since packing can start the moment the order
// comes in.

// export const markPacked = async (orderId, storeId) => {
//   const order = await minuteOrderModel.findOneAndUpdate(
//     { _id: orderId, storeId },
//     { packedByStore: true },
//     { new: true }
//   );
//   if (!order) throw new Error("Order not found for this store");

//   emitToOrderRoom(orderId, "order-packed", order);
//   if (order.riderId) {
//     try {
//       getIO().to(`rider:${order.riderId.toString()}`).emit("order-packed", order);
//     } catch (e) {}
//   }

//   return order;
// };
export const markPacked = async (orderId, storeId) => {
  await minuteOrderModel.findOneAndUpdate(
    { _id: orderId, storeId },
    { packedByStore: true },
    { new: true }
  );

  const order = await minuteOrderModel
    .findById(orderId)
    .populate("riderId", "name phone vehicleType rating status");

  if (!order) throw new Error("Order not found for this store");

  emitToOrderRoom(orderId, "order-packed", order);

  // 👇 Store dashboard ko bhi populated rider ke saath update bhejo
  emitToStoreRoom(
    order.storeId.toString(),
    "order-status-update",
    order
  );

  if (order.riderId) {
    try {
      getIO()
        .to(`rider:${order.riderId._id.toString()}`)
        .emit("order-packed", order);
    } catch (e) {}
  }

  return order;
};

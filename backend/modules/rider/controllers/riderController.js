import riderModel from "../models/riderModel.js";
import minuteOrderModel from "../../minutes/models/minuteOrderModel.js";
import * as orderService from "../../minutes/services/minuteOrderService.js";
import * as minuteOrderQueue from "../../minutes/queue/minuteOrderQueue.js";

export const getRiderProfile = async (req, res) => {
  try {
    const { riderId } = req.body;
    const rider = await riderModel
      .findById(riderId)
      .select("-password")
      .populate("storeId", "name address");
    res.json({ success: true, rider });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const updateRiderProfile = async (req, res) => {
  try {
    const { riderId, name, phone, vehicleType, vehicleNumber } = req.body;
    const update = { name, phone, vehicleType, vehicleNumber };
    if (req.file) update.profileImage = req.file.path;

    const rider = await riderModel
      .findByIdAndUpdate(riderId, update, { new: true })
      .select("-password");

    res.json({ success: true, rider });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Toggle Online / Offline. A rider that is "on_delivery" cannot go offline
// until their current order is delivered.
export const toggleAvailability = async (req, res) => {
  try {
    const { riderId, lat, lng } = req.body;
    const rider = await riderModel.findById(riderId);

    if (rider.status === "on_delivery") {
      return res.json({ success: false, message: "Finish your current delivery first" });
    }

    rider.status = rider.status === "online" ? "offline" : "online";
    if (lat && lng) rider.location = { lat: Number(lat), lng: Number(lng), updatedAt: Date.now() };
    await rider.save();

    if (rider.status === "online" && rider.storeId) {
      await minuteOrderQueue.assignNextStoreOrder(rider.storeId);
    }

    res.json({ success: true, rider });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// The order currently offered to / assigned to this rider (if any).
// export const getAssignedOrder = async (req, res) => {
//   try {
//     const { riderId } = req.body;
//     const rider = await riderModel.findById(riderId).populate("storeId", "name");
//     const order = await minuteOrderModel
//       .findOne({
//         riderId,
//         status: { $nin: ["delivered", "cancelled", "rejected"] },
//       })
//       .sort({ date: -1 });

//     const pendingCount = rider?.storeId
//       ? await minuteOrderQueue.getStorePendingCount(rider.storeId)
//       : 0;

//     res.json({ success: true, order: order || null, pendingCount });
//   } catch (e) {
//     console.log(e);
//     res.json({ success: false, message: e.message });
//   }
// };
export const getAssignedOrder = async (req, res) => {
  try {
    const { riderId } = req.body;
    const rider = await riderModel.findById(riderId).populate("storeId", "name");
    const order = await minuteOrderModel
      .findOne({
        riderId,
        status: { $nin: ["delivered", "cancelled", "rejected"] },
      })
      .sort({ date: -1 });

    // NEW: agar koi order isi rider ko offer hua hai aur abhi tak
    // accept/reject nahi hua, toh use bhi bhejo — taaki refresh pe
    // bhi offer card dikhta rahe. (Reject/Accept hote hi yeh khud
    // hi query se hat jayega, koi extra cleanup nahi chahiye.)
    const offeredOrder = await minuteOrderModel
      .findOne({
        pendingOfferRiderId: riderId,
        status: "searching_rider",
      })
      .sort({ date: -1 });

    const pendingCount = rider?.storeId
      ? await minuteOrderQueue.getStorePendingCount(rider.storeId)
      : 0;

    res.json({
      success: true,
      order: order || null,
      offeredOrder: offeredOrder || null, // 👈 naya field
      pendingCount,
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const getRiderOrderHistory = async (req, res) => {
  try {
    const { riderId } = req.body;
    const orders = await minuteOrderModel
      .find({ riderId, status: "delivered" })
      .sort({ deliveredAt: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// REST fallbacks for the order-flow actions (socket events are the
// primary/real-time path, these exist so the rider app also works if a
// socket reconnect is in progress).
export const acceptOrderRest = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;
    const order = await orderService.acceptOrder(orderId, riderId);
    res.json({ success: true, order });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};

export const rejectOrderRest = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;
    const order = await orderService.rejectOrder(orderId, riderId);
    res.json({ success: true, order });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};

export const arrivedAtStoreRest = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;
    const order = await orderService.markArrivedAtStore(orderId, riderId);
    res.json({ success: true, order });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};

export const pickupOrderRest = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;
    const order = await orderService.pickupOrder(orderId, riderId);
    res.json({ success: true, order });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};

export const deliveredOrderRest = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;
    const order = await orderService.markDelivered(orderId, riderId);
    res.json({ success: true, order });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
};

// Admin: list all riders for the Riders management page.
export const listAllRiders = async (req, res) => {
  try {
    const riders = await riderModel
      .find({})
      .select("-password")
      .populate("storeId", "name")
      .sort({ date: -1 });
    res.json({ success: true, riders });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

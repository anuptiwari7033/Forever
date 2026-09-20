import minuteOrderModel from "../../minutes/models/minuteOrderModel.js";
import trackingModel from "../models/trackingModel.js";

// REST fallback for clients that haven't established a socket connection
// yet (e.g. first paint of the tracking screen) — polls the same live
// location field the socket broadcasts from.
export const getLiveStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await minuteOrderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    res.json({
      success: true,
      status: order.status,
      currentRiderLocation: order.currentRiderLocation,
      distanceRemainingKm: order.distanceRemainingKm,
      etaMinutes: order.etaMinutes,
      storeLocation: order.storeLocation,
      customerLocation: order.address.location,
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const getOrderCheckpoints = async (req, res) => {
  try {
    const { orderId } = req.params;
    const checkpoints = await trackingModel.find({ orderId }).sort({ date: 1 });
    res.json({ success: true, checkpoints });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

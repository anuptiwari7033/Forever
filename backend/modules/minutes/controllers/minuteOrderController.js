import minuteOrderModel from "../models/minuteOrderModel.js";
import storeModel from "../models/storeModel.js";
import trackingModel from "../../tracking/models/trackingModel.js";
import * as orderService from "../services/minuteOrderService.js";

// Customer: place a new Forever Minutes order.
export const placeMinuteOrder = async (req, res) => {
  try {
    const { userId, storeId, items, amount, deliveryFee, discount, couponCode, address, paymentMethod } =
      req.body;

    const store = await storeModel.findById(storeId);
    if (!store) return res.json({ success: false, message: "Store not found" });

    const order = await orderService.placeOrder({
      userId,
      storeId,
      items,
      amount,
      deliveryFee,
      discount,
      couponCode,
      address,
      storeLocation: store.location,
      paymentMethod,
    });

    res.json({ success: true, order });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listCustomerOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await minuteOrderModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const getMinuteOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await minuteOrderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    const checkpoints = await trackingModel.find({ orderId }).sort({ date: 1 });

    res.json({ success: true, order, checkpoints });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const cancelMinuteOrder = async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    const order = await minuteOrderModel.findOne({ _id: orderId, userId });
    if (!order) return res.json({ success: false, message: "Order not found" });

    if (["delivered", "out_for_delivery", "arrived_at_customer"].includes(order.status)) {
      return res.json({ success: false, message: "Order can no longer be cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ success: true, order });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Admin: list every Forever Minutes order across all customers.
export const listAllMinuteOrders = async (req, res) => {
  try {
    const orders = await minuteOrderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

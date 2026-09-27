import storeModel from "../../minutes/models/storeModel.js";
import minuteOrderModel from "../../minutes/models/minuteOrderModel.js";
import * as orderService from "../../minutes/services/minuteOrderService.js";

export const getStoreProfile = async (req, res) => {
  try {
    const { storeId } = req.body;
    const store = await storeModel.findById(storeId).select("-password");
    res.json({ success: true, store });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Every order for this store, most recent first, with rider basic info
// populated (name/phone/vehicleType/rating) so the dashboard can show
// "accepted by <rider>" without a second round trip.
export const getStoreOrders = async (req, res) => {
  try {
    const { storeId } = req.body;
    const orders = await minuteOrderModel
      .find({ storeId })
      .sort({ date: -1 })
      .populate("riderId", "name phone vehicleType rating status");
    res.json({ success: true, orders });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// "Pack this order" button on the store dashboard.
export const markOrderPacked = async (req, res) => {
  try {
    const { storeId, orderId } = req.body;
    const order = await orderService.markPacked(orderId, storeId);
    res.json({ success: true, order });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Everything actually SOLD (delivered) on one calendar day, with a
// product-by-product breakdown and the day's total — this only counts
// orders that reached "delivered", not ones still in progress or cancelled.
export const getDailySales = async (req, res) => {
  try {
    const { storeId, date } = req.body; // date: "YYYY-MM-DD"
    if (!date) return res.json({ success: false, message: "Date is required" });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const orders = await minuteOrderModel
      .find({
        storeId,
        status: "delivered",
        deliveredAt: { $gte: dayStart.getTime(), $lte: dayEnd.getTime() },
      })
      .sort({ deliveredAt: 1 });

    // Product-level rollup for the day (name -> quantity, revenue).
    const productTotals = {};
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.name;
        if (!productTotals[key]) productTotals[key] = { name: item.name, quantity: 0, revenue: 0 };
        productTotals[key].quantity += item.quantity;
        productTotals[key].revenue += item.price * item.quantity;
      }
    }

    const total = orders.reduce((sum, o) => sum + o.amount, 0);

    res.json({
      success: true,
      date,
      orders,
      products: Object.values(productTotals),
      total,
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Money-only view: every day from the 1st of the current month up to
// today, each day's total delivered revenue, plus the running grand total.
export const getMonthlySales = async (req, res) => {
  try {
    const { storeId } = req.body;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const orders = await minuteOrderModel.find({
      storeId,
      status: "delivered",
      deliveredAt: { $gte: monthStart.getTime(), $lte: now.getTime() },
    });

    const dayTotals = {};
    for (const order of orders) {
      const d = new Date(order.deliveredAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      dayTotals[key] = (dayTotals[key] || 0) + order.amount;
    }

    // Fill in every day of the range even if it had zero sales, so the
    // list always reads "1st, 2nd, 3rd... today" without gaps.
    const days = [];
    const cursor = new Date(monthStart);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate()
      ).padStart(2, "0")}`;
      days.push({ date: key, total: dayTotals[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const grandTotal = days.reduce((sum, d) => sum + d.total, 0);

    res.json({ success: true, days, grandTotal });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

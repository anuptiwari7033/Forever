import express from "express";
import {
  placeMinuteOrder,
  listCustomerOrders,
  getMinuteOrderById,
  cancelMinuteOrder,
  listAllMinuteOrders,
} from "../controllers/minuteOrderController.js";
import authUser from "../../../middleware/auth.js";
import adminAuth from "../../../middleware/adminAuth.js";

const minuteOrderRouter = express.Router();

// Customer
minuteOrderRouter.post("/place", authUser, placeMinuteOrder);
minuteOrderRouter.post("/user-orders", authUser, listCustomerOrders);
minuteOrderRouter.post("/cancel", authUser, cancelMinuteOrder);
minuteOrderRouter.get("/:orderId", authUser, getMinuteOrderById);

// Admin
minuteOrderRouter.get("/admin/list", adminAuth, listAllMinuteOrders);

export default minuteOrderRouter;

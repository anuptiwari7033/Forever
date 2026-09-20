import express from "express";
import { loginStore } from "../controllers/storeAuthController.js";
import {
  getStoreProfile,
  getStoreOrders,
  markOrderPacked,
  getDailySales,
  getMonthlySales,
} from "../controllers/storeController.js";
import storeAuth from "../middleware/storeAuth.js";

const storePortalRouter = express.Router();

storePortalRouter.post("/login", loginStore);
storePortalRouter.post("/profile", storeAuth, getStoreProfile);
storePortalRouter.post("/orders", storeAuth, getStoreOrders);
storePortalRouter.post("/order/mark-packed", storeAuth, markOrderPacked);
storePortalRouter.post("/sales/daily", storeAuth, getDailySales);
storePortalRouter.post("/sales/monthly", storeAuth, getMonthlySales);

export default storePortalRouter;

import express from "express";
import { getLiveStatus, getOrderCheckpoints } from "../controllers/trackingController.js";
import authUser from "../../../middleware/auth.js";

const trackingRouter = express.Router();

trackingRouter.get("/live/:orderId", authUser, getLiveStatus);
trackingRouter.get("/checkpoints/:orderId", authUser, getOrderCheckpoints);

export default trackingRouter;

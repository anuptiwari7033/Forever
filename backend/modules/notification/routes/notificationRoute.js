import express from "express";
import authUser from "../../../middleware/auth.js";
import riderAuth from "../../rider/middleware/riderAuth.js";
import {
  listCustomerNotifications,
  listRiderNotifications,
  markNotificationRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/customer", authUser, listCustomerNotifications);
notificationRouter.get("/rider", riderAuth, listRiderNotifications);
notificationRouter.post("/mark-read", markNotificationRead);

export default notificationRouter;

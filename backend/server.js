import express from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";
import morgan from "morgan";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// ---- Velora Minutes additions (new modules, existing routes above are untouched) ----
import initSocket from "./socket/index.js";
import categoryRouter from "./modules/minutes/routes/categoryRoute.js";
import storeRouter from "./modules/minutes/routes/storeRoute.js";
import minuteProductRouter from "./modules/minutes/routes/minuteProductRoute.js";
import minuteOrderRouter from "./modules/minutes/routes/minuteOrderRoute.js";
import addressRouter from "./modules/minutes/routes/addressRoute.js";
import minutesCartRouter from "./modules/minutes/routes/cartRoute.js";
import couponRouter from "./modules/minutes/routes/couponRoute.js";
import walletRouter from "./modules/minutes/routes/walletRoute.js";
import riderRouter from "./modules/rider/routes/riderRoute.js";
import storePortalRouter from "./modules/store/routes/storeRoute.js";
import trackingRouter from "./modules/tracking/routes/trackingRoute.js";
import notificationRouter from "./modules/notification/routes/notificationRoute.js";
import {
  resumePendingQueues,
  closeAllQueues,
} from "./modules/minutes/queue/minuteOrderQueue.js";

//App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB()
  .then(() => resumePendingQueues()) // re-drive rider assignment after a restart (req 13)
  .catch((e) => console.error("DB connect failed:", e.message));
connectCloudinary();
//Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

//API endpoints (existing ecommerce — unchanged)
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

//API endpoints (new Velora Minutes module)
app.use("/api/minutes/category", categoryRouter);
app.use("/api/minutes/store", storeRouter);
app.use("/api/minutes/product", minuteProductRouter);
app.use("/api/minutes/order", minuteOrderRouter);
app.use("/api/minutes/address", addressRouter);
app.use("/api/minutes/cart", minutesCartRouter);
app.use("/api/minutes/coupon", couponRouter);
app.use("/api/minutes/wallet", walletRouter);
app.use("/api/rider", riderRouter);
app.use("/api/store", storePortalRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/notification", notificationRouter);

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// Wrap Express in a plain HTTP server so Socket.IO can share the same port
// (required for the Forever Minutes live-tracking feature).
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Server started on http://localhost:${port} ❤️`);
});

// Close BullMQ workers/queues cleanly so Redis connections don't leak on restart.
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  try {
    await closeAllQueues();
  } catch (e) {
    console.error("Error during queue shutdown:", e.message);
  }
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));



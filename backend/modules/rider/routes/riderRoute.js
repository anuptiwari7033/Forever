// import express from "express";
// import { registerRider, loginRider } from "../controllers/riderAuthController.js";
// import {
//   getRiderProfile,
//   updateRiderProfile,
//   toggleAvailability,
//   getAssignedOrder,
//   getRiderOrderHistory,
//   acceptOrderRest,
//   rejectOrderRest,
//   arrivedAtStoreRest,
//   pickupOrderRest,
//   deliveredOrderRest,
//   listAllRiders,
// } from "../controllers/riderController.js";
// import riderAuth from "../middleware/riderAuth.js";
// import adminAuth from "../../../middleware/adminAuth.js";
// import upload from "../../../middleware/multer.js";

// const riderRouter = express.Router();

// // Auth
// riderRouter.post("/register", registerRider);
// riderRouter.post("/login", loginRider);

// // Profile
// riderRouter.post("/profile", riderAuth, getRiderProfile);
// riderRouter.post("/profile/update", riderAuth, upload.single("image"), updateRiderProfile);
// riderRouter.post("/toggle-status", riderAuth, toggleAvailability);

// // Orders
// riderRouter.post("/assigned-order", riderAuth, getAssignedOrder);
// riderRouter.post("/order-history", riderAuth, getRiderOrderHistory);
// riderRouter.post("/order/accept", riderAuth, acceptOrderRest);
// riderRouter.post("/order/reject", riderAuth, rejectOrderRest);
// riderRouter.post("/order/arrived-at-store", riderAuth, arrivedAtStoreRest);
// riderRouter.post("/order/pickup", riderAuth, pickupOrderRest);
// riderRouter.post("/order/delivered", riderAuth, deliveredOrderRest);

// // Admin
// riderRouter.get("/admin/list", adminAuth, listAllRiders);

// export default riderRouter;
import express from "express";
import { adminAddRider, adminRemoveRider, loginRider } from "../controllers/riderAuthController.js";
import {
  getRiderProfile,
  updateRiderProfile,
  toggleAvailability,
  getAssignedOrder,
  getRiderOrderHistory,
  acceptOrderRest,
  rejectOrderRest,
  arrivedAtStoreRest,
  pickupOrderRest,
  deliveredOrderRest,
  listAllRiders,
} from "../controllers/riderController.js";
import riderAuth from "../middleware/riderAuth.js";
import adminAuth from "../../../middleware/adminAuth.js";
import upload from "../../../middleware/multer.js";

const riderRouter = express.Router();

// Auth — riders only log in here, they never self-register.
riderRouter.post("/login", loginRider);

// Profile
riderRouter.post("/profile", riderAuth, getRiderProfile);
riderRouter.post("/profile/update", riderAuth, upload.single("image"), updateRiderProfile);
riderRouter.post("/toggle-status", riderAuth, toggleAvailability);

// Orders
riderRouter.post("/assigned-order", riderAuth, getAssignedOrder);
riderRouter.post("/order-history", riderAuth, getRiderOrderHistory);
riderRouter.post("/order/accept", riderAuth, acceptOrderRest);
riderRouter.post("/order/reject", riderAuth, rejectOrderRest);
riderRouter.post("/order/arrived-at-store", riderAuth, arrivedAtStoreRest);
riderRouter.post("/order/pickup", riderAuth, pickupOrderRest);
riderRouter.post("/order/delivered", riderAuth, deliveredOrderRest);

// Admin — hires/removes riders for a store
riderRouter.get("/admin/list", adminAuth, listAllRiders);
riderRouter.post("/admin/add", adminAuth, adminAddRider);
riderRouter.post("/admin/remove", adminAuth, adminRemoveRider);

export default riderRouter;
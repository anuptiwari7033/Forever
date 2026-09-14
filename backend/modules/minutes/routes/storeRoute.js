import express from "express";
import {
  listNearbyStores,
  listStoreNames,
  getStoreById,
  addStore,
  listAllStores,
  toggleStoreStatus,
  removeStore,
} from "../controllers/storeController.js";
import adminAuth from "../../../middleware/adminAuth.js";
import upload from "../../../middleware/multer.js";

const storeRouter = express.Router();

// Public / customer
storeRouter.get("/nearby", listNearbyStores);
storeRouter.get("/names", listStoreNames); // used by rider signup dropdown
storeRouter.get("/:storeId", getStoreById);

// Admin
storeRouter.post("/add", adminAuth, upload.single("image"), addStore);
storeRouter.get("/admin/list", adminAuth, listAllStores);
storeRouter.post("/toggle-status", adminAuth, toggleStoreStatus);
storeRouter.post("/remove", adminAuth, removeStore);

export default storeRouter;

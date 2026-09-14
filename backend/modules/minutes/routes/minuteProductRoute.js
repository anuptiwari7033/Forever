import express from "express";
import {
  listStoreProducts,
  listByCategory,
  searchProducts,
  getProductById,
  addMinuteProduct,
  listAllMinuteProducts,
  removeMinuteProduct,
} from "../controllers/minuteProductController.js";
import adminAuth from "../../../middleware/adminAuth.js";
import upload from "../../../middleware/multer.js";

const minuteProductRouter = express.Router();

// Public / customer
minuteProductRouter.get("/store/:storeId", listStoreProducts);
minuteProductRouter.get("/category/:category", listByCategory);
minuteProductRouter.get("/search", searchProducts);
minuteProductRouter.get("/:productId", getProductById);

// Admin
minuteProductRouter.post("/add", adminAuth, upload.single("image"), addMinuteProduct);
minuteProductRouter.get("/admin/list", adminAuth, listAllMinuteProducts);
minuteProductRouter.post("/remove", adminAuth, removeMinuteProduct);

export default minuteProductRouter;

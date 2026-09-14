import express from "express";
import {
  listCategories,
  listStoreCategories,
  addCategory,
  removeCategory,
} from "../controllers/categoryController.js";
import adminAuth from "../../../middleware/adminAuth.js";
import upload from "../../../middleware/multer.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", listCategories);
categoryRouter.get("/store/:storeId", listStoreCategories);
categoryRouter.post("/add", adminAuth, upload.single("image"), addCategory);
categoryRouter.post("/remove", adminAuth, removeCategory);

export default categoryRouter;

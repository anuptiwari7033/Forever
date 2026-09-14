import express from "express";
import { getMinutesCart, syncMinutesCart } from "../controllers/cartController.js";
import authUser from "../../../middleware/auth.js";

const minutesCartRouter = express.Router();

minutesCartRouter.post("/get", authUser, getMinutesCart);
minutesCartRouter.post("/sync", authUser, syncMinutesCart);

export default minutesCartRouter;

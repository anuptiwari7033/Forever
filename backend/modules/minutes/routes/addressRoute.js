import express from "express";
import { addAddress, listAddresses, removeAddress } from "../controllers/addressController.js";
import authUser from "../../../middleware/auth.js";

const addressRouter = express.Router();

addressRouter.post("/add", authUser, addAddress);
addressRouter.post("/list", authUser, listAddresses);
addressRouter.post("/remove", authUser, removeAddress);

export default addressRouter;

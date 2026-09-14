import express from "express";
import { getWallet, creditWallet, debitWallet } from "../controllers/walletController.js";
import authUser from "../../../middleware/auth.js";

const walletRouter = express.Router();

walletRouter.post("/get", authUser, getWallet);
walletRouter.post("/credit", authUser, creditWallet);
walletRouter.post("/debit", authUser, debitWallet);

export default walletRouter;

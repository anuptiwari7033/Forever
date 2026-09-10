import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, enum: ["credit", "debit"], required: true },
      amount: { type: Number, required: true },
      description: { type: String, default: "" },
      date: { type: Number, default: () => Date.now() },
    },
  ],
});

const walletModel = mongoose.models.minuteWallet || mongoose.model("minuteWallet", walletSchema);
export default walletModel;

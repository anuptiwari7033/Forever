import walletModel from "../models/walletModel.js";

const getOrCreateWallet = async (userId) => {
  let wallet = await walletModel.findOne({ userId });
  if (!wallet) wallet = await walletModel.create({ userId, balance: 0, transactions: [] });
  return wallet;
};

export const getWallet = async (req, res) => {
  try {
    const { userId } = req.body;
    const wallet = await getOrCreateWallet(userId);
    res.json({ success: true, wallet });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const creditWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const wallet = await getOrCreateWallet(userId);
    wallet.balance += Number(amount);
    wallet.transactions.push({ type: "credit", amount: Number(amount), description });
    await wallet.save();
    res.json({ success: true, wallet });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const debitWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const wallet = await getOrCreateWallet(userId);
    if (wallet.balance < Number(amount)) {
      return res.json({ success: false, message: "Insufficient wallet balance" });
    }
    wallet.balance -= Number(amount);
    wallet.transactions.push({ type: "debit", amount: Number(amount), description });
    await wallet.save();
    res.json({ success: true, wallet });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

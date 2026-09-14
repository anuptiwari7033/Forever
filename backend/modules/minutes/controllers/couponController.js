import couponModel from "../models/couponModel.js";

export const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await couponModel.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.json({ success: false, message: "Invalid coupon code" });
    if (coupon.expiry < Date.now()) return res.json({ success: false, message: "Coupon expired" });
    if (orderAmount < coupon.minOrderAmount) {
      return res.json({
        success: false,
        message: `Minimum order amount is ${coupon.minOrderAmount}`,
      });
    }

    let discount =
      coupon.discountType === "percent"
        ? (orderAmount * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);

    res.json({ success: true, discount, coupon });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Admin
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiry } = req.body;
    const coupon = await couponModel.create({
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiry: Number(expiry),
    });
    res.json({ success: true, coupon });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({}).sort({ date: -1 });
    res.json({ success: true, coupons });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

import userModel from "../../../models/userModel.js";

// GET current user's Forever Minutes cart. Kept completely separate from
// the ecommerce cart (cartData) so switching modules never clears either.
export const getMinutesCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId);
    if (!userData) return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      cartData: userData.minutesCartData || {},
      selectedStore: userData.minutesSelectedStore || null,
    });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Whole-cart replace, called by the frontend whenever minutesCart /
// selectedStore changes. Simpler than the ecommerce per-item add/update
// endpoints since Forever Minutes' cart already holds full product
// objects client-side — there's nothing to look up server-side.
export const syncMinutesCart = async (req, res) => {
  try {
    const { userId, cartData, selectedStore } = req.body;
    await userModel.findByIdAndUpdate(userId, {
      minutesCartData: cartData || {},
      minutesSelectedStore: selectedStore || null,
    });
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

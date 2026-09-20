import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import storeModel from "../../minutes/models/storeModel.js";

// Stores are created by the admin (see minutes/controllers/storeController.js
// -> addStore), not self-registered — so this module only has login.
export const loginStore = async (req, res) => {
  try {
    const { email, password } = req.body;

    const store = await storeModel.findOne({ email });
    if (!store) return res.json({ success: false, message: "Store does not exist" });

    const isMatch = await bcrypt.compare(password, store.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: store._id, role: "store" }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// import validator from "validator";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import riderModel from "../models/riderModel.js";
// import storeModel from "../../minutes/models/storeModel.js";

// // Same token shape convention as the existing createToken() in
// // userController.js, but with a `role` claim so riderAuth middleware can
// // tell rider tokens apart from customer tokens.
// const createRiderToken = (id) => jwt.sign({ id, role: "rider" }, process.env.JWT_SECRET);

// export const registerRider = async (req, res) => {
//   try {
//     const { name, email, phone, password, vehicleType, vehicleNumber, storeId } = req.body;

//     if (!storeId) {
//       return res.json({ success: false, message: "Please select the store you'll be riding for" });
//     }
//     const store = await storeModel.findById(storeId);
//     if (!store) return res.json({ success: false, message: "Selected store was not found" });

//     const exists = await riderModel.findOne({ email });
//     if (exists) return res.json({ success: false, message: "Rider already exists" });

//     if (!validator.isEmail(email)) {
//       return res.json({ success: false, message: "Please enter a valid email" });
//     }
//     if (password.length < 8) {
//       return res.json({ success: false, message: "Please enter a strong password" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const rider = await riderModel.create({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       vehicleType,
//       vehicleNumber,
//       storeId,
//     });

//     const token = createRiderToken(rider._id);
//     res.json({ success: true, token });
//   } catch (e) {
//     console.log(e);
//     res.json({ success: false, message: e.message });
//   }
// };

// export const loginRider = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const rider = await riderModel.findOne({ email });
//     if (!rider) return res.json({ success: false, message: "Rider does not exist" });

//     const isMatch = await bcrypt.compare(password, rider.password);
//     if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

//     const token = createRiderToken(rider._id);
//     res.json({ success: true, token });
//   } catch (e) {
//     console.log(e);
//     res.json({ success: false, message: e.message });
//   }
// };
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import riderModel from "../models/riderModel.js";
import storeModel from "../../minutes/models/storeModel.js";

const createRiderToken = (id) => jwt.sign({ id, role: "rider" }, process.env.JWT_SECRET);

// Riders do NOT self-register — a store's admin hires them and creates
// their account here (adminAuth-protected, see riderRoute.js), then hands
// the rider their email/password to log into the rider app.
export const adminAddRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType, vehicleNumber, storeId } = req.body;

    if (!storeId) {
      return res.json({ success: false, message: "Please select which store this rider works for" });
    }
    const store = await storeModel.findById(storeId);
    if (!store) return res.json({ success: false, message: "Selected store was not found" });

    const exists = await riderModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "A rider with this email already exists" });

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (!password || password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const rider = await riderModel.create({
      name,
      email,
      phone,
      password: hashedPassword,
      vehicleType,
      vehicleNumber,
      storeId,
    });

    res.json({ success: true, rider: { ...rider.toObject(), password: undefined } });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const adminRemoveRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    await riderModel.findByIdAndDelete(riderId);
    res.json({ success: true, message: "Rider removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const loginRider = async (req, res) => {
  try {
    const { email, password } = req.body;

    const rider = await riderModel.findOne({ email });
    if (!rider) return res.json({ success: false, message: "Rider does not exist" });

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = createRiderToken(rider._id);
    res.json({ success: true, token });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};
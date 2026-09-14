import bcrypt from "bcrypt";
import validator from "validator";
import storeModel from "../models/storeModel.js";
import { getDistanceKm } from "../../tracking/services/geoService.js";
import { v2 as cloudinary } from "cloudinary";

// Public: list stores near the customer's current location, nearest first.
// A store only shows up if the customer is within THAT store's own
// radiusKm — a store on the other side of the city won't be able to
// promise a "minutes" delivery, so it's excluded rather than just sorted last.
export const listNearbyStores = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const stores = await storeModel.find({ isOpen: true });

    let result = stores.map((s) => s.toObject());

    if (lat && lng) {
      const origin = { lat: Number(lat), lng: Number(lng) };
      result = result
        .map((s) => ({ ...s, distanceKm: getDistanceKm(origin, s.location) }))
        .filter((s) => s.distanceKm <= (s.radiusKm ?? 5))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json({ success: true, stores: result });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Public, minimal: just id + name + address, used by the rider signup form
// so a new rider can pick which store they work for. Deliberately doesn't
// expose email/password/radius/etc.
export const listStoreNames = async (req, res) => {
  try {
    const stores = await storeModel.find({}).select("name address");
    res.json({ success: true, stores });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await storeModel.findById(storeId);
    if (!store) return res.json({ success: false, message: "Store not found" });
    res.json({ success: true, store });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Admin: create a Forever Minutes store, including its own login
// credentials for the separate Store dashboard app.
export const addStore = async (req, res) => {
  try {
    const { name, email, password, contactNumber, address, lat, lng, prepTimeMinutes, radiusKm } =
      req.body;
    const image = req.file ? req.file.path : req.body.image;
        const result = await cloudinary.uploader.upload(image, {
      resource_type: "image",
    });
    
    const imageUrl = result.secure_url;

    const exists = await storeModel.findOne({ email });
    if (exists) return res.json({ success: false, message: "A store with this email already exists" });

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid store email" });
    }
    if (!password || password.length < 8) {
      return res.json({ success: false, message: "Store password must be at least 8 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const store = await storeModel.create({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      address,
      image: imageUrl,
      location: { lat: Number(lat), lng: Number(lng) },
      prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 10,
      radiusKm: radiusKm ? Number(radiusKm) : 5,
    });

    res.json({ success: true, store });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listAllStores = async (req, res) => {
  try {
    const stores = await storeModel.find({}).sort({ date: -1 });
    res.json({ success: true, stores });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const toggleStoreStatus = async (req, res) => {
  try {
    const { storeId } = req.body;
    const store = await storeModel.findById(storeId);
    store.isOpen = !store.isOpen;
    await store.save();
    res.json({ success: true, store });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const removeStore = async (req, res) => {
  try {
    const { storeId } = req.body;
    await storeModel.findByIdAndDelete(storeId);
    res.json({ success: true, message: "Store removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

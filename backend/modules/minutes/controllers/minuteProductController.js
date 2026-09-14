import minuteProductModel from "../models/minuteProductModel.js";
import { v2 as cloudinary } from "cloudinary";

export const listStoreProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const products = await minuteProductModel.find({ storeId, isAvailable: true });
    res.json({ success: true, products });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await minuteProductModel.find({ category, isAvailable: true });
    res.json({ success: true, products });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const products = await minuteProductModel.find({
      isAvailable: true,
      name: { $regex: q || "", $options: "i" },
    });
    res.json({ success: true, products });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await minuteProductModel.findById(productId);
    if (!product) return res.json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Admin
export const addMinuteProduct = async (req, res) => {
  try {
    const { storeId, name, description, price, mrp, unit, category, stock } = req.body;
    const image = req.file ? req.file.path : req.body.image;
        const result = await cloudinary.uploader.upload(image, {
      resource_type: "image",
    });
    
    const imageUrl = result.secure_url;

    const product = await minuteProductModel.create({
      storeId,
      name,
      description,
      price: Number(price),
      mrp: Number(mrp),
      unit,
      category,
      image: imageUrl,
      stock: stock ? Number(stock) : 100,
    });

    res.json({ success: true, product });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listAllMinuteProducts = async (req, res) => {
  try {
    const products = await minuteProductModel.find({}).sort({ date: -1 });
    res.json({ success: true, products });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const removeMinuteProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    await minuteProductModel.findByIdAndDelete(productId);
    res.json({ success: true, message: "Product removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

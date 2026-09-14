import minuteCategoryModel from "../models/minuteCategoryModel.js";
import minuteProductModel from "../models/minuteProductModel.js";
import { v2 as cloudinary } from "cloudinary";

export const listCategories = async (req, res) => {
  try {
    const categories = await minuteCategoryModel.find({}).sort({ date: 1 });
    res.json({ success: true, categories });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Only the categories that actually have at least one product in THIS
// store, with each category's group/image — this is what powers the
// "Grocery & Kitchen" / "Snacks & Drinks" section view once a store is
// selected (matches the reference screenshots).
export const listStoreCategories = async (req, res) => {
  try {
    const { storeId } = req.params;

    const distinctCategoryNames = await minuteProductModel.distinct("category", {
      storeId,
      isAvailable: true,
    });

    const categories = await minuteCategoryModel
      .find({ name: { $in: distinctCategoryNames } })
      .sort({ date: 1 });

    // Group by section header, preserving insertion order.
    const grouped = {};
    for (const cat of categories) {
      if (!grouped[cat.group]) grouped[cat.group] = [];
      grouped[cat.group].push(cat);
    }

    res.json({ success: true, groups: grouped });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// Admin
export const addCategory = async (req, res) => {
  try {
    const { name, group } = req.body;
    const image = req.file ? req.file.path : req.body.image;
    const result = await cloudinary.uploader.upload(image, {
  resource_type: "image",
});

const imageUrl = result.secure_url;
    const category = await minuteCategoryModel.create({ name, group, image: imageUrl });
    res.json({ success: true, category });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    await minuteCategoryModel.findByIdAndDelete(categoryId);
    res.json({ success: true, message: "Category removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

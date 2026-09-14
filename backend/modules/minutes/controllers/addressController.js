import addressModel from "../models/addressModel.js";

export const addAddress = async (req, res) => {
  try {
    const {
      userId,
      label,
      addressLine,
      houseNumber,
      area,
      contactName,
      phone,
      alternatePhone,
      lat,
      lng,
      isDefault,
    } = req.body;

    if (isDefault) {
      await addressModel.updateMany({ userId }, { isDefault: false });
    }

    // Back-compat: callers that only ever sent `addressLine` (old
    // Addresses.jsx / Checkout.jsx quick-add forms) keep working exactly
    // as before — houseNumber/area/contactName/phone are simply blank.
    const address = await addressModel.create({
      userId,
      label,
      addressLine: addressLine || [houseNumber, area].filter(Boolean).join(", "),
      houseNumber: houseNumber || "",
      area: area || "",
      contactName: contactName || "",
      phone: phone || "",
      alternatePhone: alternatePhone || "",
      location: { lat: Number(lat), lng: Number(lng) },
      isDefault: !!isDefault,
    });

    res.json({ success: true, address });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const listAddresses = async (req, res) => {
  try {
    const { userId } = req.body;
    const addresses = await addressModel.find({ userId }).sort({ isDefault: -1, date: -1 });
    res.json({ success: true, addresses });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const removeAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    await addressModel.findOneAndDelete({ _id: addressId, userId });
    res.json({ success: true, message: "Address removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

import notificationModel from "../models/notificationModel.js";

// List notifications for the logged in customer (req.body.userId set by authUser middleware)
export const listCustomerNotifications = async (req, res) => {
  try {
    const { userId } = req.body;
    const notifications = await notificationModel
      .find({ recipientType: "customer", recipientId: userId })
      .sort({ date: -1 });
    res.json({ success: true, notifications });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// List notifications for the logged in rider (req.body.riderId set by riderAuth middleware)
export const listRiderNotifications = async (req, res) => {
  try {
    const { riderId } = req.body;
    const notifications = await notificationModel
      .find({ recipientType: "rider", recipientId: riderId })
      .sort({ date: -1 });
    res.json({ success: true, notifications });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    await notificationModel.findByIdAndUpdate(notificationId, { isRead: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

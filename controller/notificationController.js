const Notification = require("../model/notification");
const { success } = require("../utils/apiResponse");
exports.list = async (req, res) =>
  success(
    res,
    200,
    "Notifications retrieved",
    await Notification.find({
      user: req.user._id,
      ...(req.query.unread === "true" ? { isRead: false } : {}),
    })
      .sort({ createdAt: -1 })
      .limit(50),
  );
exports.read = async (req, res) =>
  success(
    res,
    200,
    "Notification marked as read",
    await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { isRead: true },
      { new: true },
    ),
  );
exports.readAll = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true },
  );
  return success(res, 200, "Notifications marked as read");
};

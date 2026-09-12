const Notification = require("../model/notification");
const { brevo } = require("../utils/brevo");

exports.notify = async ({ user, type, title, message, data, emailHtml }) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    data,
  });
  if (emailHtml) {
    try {
      const User = require("../model/user");
      const recipient = await User.findById(user).select("email fullName");
      if (recipient) {
        await brevo(recipient.email, recipient.fullName, emailHtml);
        notification.emailSent = true;
        await notification.save();
      }
    } catch (error) {
      console.error("Notification email failed:", error.message);
    }
  }
  return notification;
};

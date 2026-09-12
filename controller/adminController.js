const User = require("../model/user");
const Course = require("../model/course");
const Enrollment = require("../model/enrollment");
const Payment = require("../model/payment");
const Review = require("../model/review");
const Certificate = require("../model/certificate");
const Notification = require("../model/notification");
const Category = require("../model/category");
const { success, failure } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");
exports.analytics = async (req, res) => {
  const [
    users,
    students,
    instructors,
    courses,
    publishedCourses,
    enrollments,
    transactions,
    revenue,
    instructorEarnings,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "instructor" }),
    Course.countDocuments(),
    Course.countDocuments({ status: "published" }),
    Enrollment.countDocuments(),
    Payment.countDocuments(),
    Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: null, total: { $sum: "$platformFee" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: null, total: { $sum: "$instructorEarnings" } } },
    ]),
  ]);
  return success(res, 200, "Platform analytics retrieved", {
    totalUsers: users,
    totalStudents: students,
    totalInstructors: instructors,
    totalCourses: courses,
    publishedCourses,
    totalEnrollments: enrollments,
    totalTransactions: transactions,
    platformRevenue: revenue[0]?.total || 0,
    instructorEarnings: instructorEarnings[0]?.total || 0,
  });
};
exports.users = async (req, res) =>
  success(
    res,
    200,
    "Users retrieved",
    await User.find({ ...(req.query.role ? { role: req.query.role } : {}) })
      .select("-password -otp -verificationOtp")
      .sort({ createdAt: -1 }),
  );
exports.setStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      isSuspended: req.body.suspended !== false,
      isActive: req.body.active !== false,
    },
    { new: true },
  ).select("-password");
  if (!user) return failure(res, 404, "User not found", "USER_NOT_FOUND");
  return success(res, 200, "User status updated", user);
};
exports.reviewCourses = async (req, res) => {
  const courses = await Course.find({
    status: req.query.status || "pending_review",
  })
    .populate("instructor", "fullName email")
    .sort({ createdAt: 1 });
  return success(res, 200, "Courses retrieved", courses);
};
exports.review = async (req, res) => {
  const controller = require("./courseController");
  return controller.adminReview(req, res);
};
exports.notify = async (req, res) => {
  const notification = await notify({
    user: req.body.userId,
    type: "admin_announcement",
    title: req.body.title,
    message: req.body.message,
    data: req.body.data,
  });
  return success(res, 201, "Notification created", notification);
};
exports.reviews = async (req, res) =>
  success(
    res,
    200,
    "Reviews retrieved",
    await Review.find()
      .populate("course", "title")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 }),
  );
exports.certificates = async (req, res) =>
  success(
    res,
    200,
    "Certificates retrieved",
    await Certificate.find()
      .populate("course", "title")
      .populate("student", "fullName email")
      .sort({ completionDate: -1 }),
  );
exports.categories = async (req, res) =>
  success(
    res,
    200,
    "Categories retrieved",
    await Category.find().sort({ name: 1 }),
  );
exports.payments = async (req, res) =>
  success(
    res,
    200,
    "Payments retrieved",
    await Payment.find()
      .populate("student", "fullName email")
      .populate("course", "title")
      .sort({ createdAt: -1 }),
  );

const bcrypt = require("bcrypt");
const User = require("../model/user");
const Enrollment = require("../model/enrollment");
const Course = require("../model/course");
const Payment = require("../model/payment");
const { success, failure } = require("../utils/apiResponse");

exports.me = async (req, res) =>
  success(res, 200, "Profile retrieved", req.user);
exports.update = async (req, res) => {
  const allowed = [
    "fullName",
    "bio",
    "avatar",
    "phone",
    "country",
    "expertise",
    "experience",
    "socialLinks",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  return success(res, 200, "Profile updated", req.user);
};
exports.changePassword = async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("+password");
  if (
    !(await bcrypt.compare(
      req.body.currentPassword || "",
      currentUser.password,
    ))
  )
    return failure(
      res,
      401,
      "Current password is incorrect",
      "PASSWORD_INVALID",
    );
  if (!req.body.newPassword || req.body.newPassword.length < 8)
    return failure(
      res,
      400,
      "New password must be at least 8 characters",
      "PASSWORD_INVALID",
    );
  currentUser.password = await bcrypt.hash(req.body.newPassword, 12);
  await currentUser.save();
  return success(res, 200, "Password changed successfully");
};
exports.publicProfile = async (req, res) => {
  const user = await User.findOne({
    _id: req.params.userId,
    role: "instructor",
    isActive: true,
  }).select("fullName avatar bio role");
  if (!user) return failure(res, 404, "Instructor not found", "USER_NOT_FOUND");
  return success(res, 200, "Profile retrieved", user);
};
exports.instructorDashboard = async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id });
  const courseIds = courses.map((course) => course._id);
  const [students, payments, completions] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds } }),
    Payment.aggregate([
      { $match: { instructor: req.user._id, status: "successful" } },
      { $group: { _id: null, revenue: { $sum: "$instructorEarnings" } } },
    ]),
    Enrollment.countDocuments({
      course: { $in: courseIds },
      status: "completed",
    }),
  ]);
  return success(res, 200, "Instructor dashboard retrieved", {
    totalCourses: courses.length,
    draftCourses: courses.filter((c) => c.status === "draft").length,
    pendingCourses: courses.filter((c) => c.status === "pending_review").length,
    publishedCourses: courses.filter((c) => c.status === "published").length,
    totalStudents: students,
    completedEnrollments: completions,
    courseViews: courses.reduce((sum, c) => sum + c.viewCount, 0),
    averageRating: courses.length
      ? Number(
          (
            courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
          ).toFixed(2),
        )
      : 0,
    earnings: payments[0]?.revenue || 0,
  });
};
exports.studentDashboard = async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate("course", "title thumbnail rating")
    .sort({ updatedAt: -1 });
  return success(res, 200, "Student dashboard retrieved", {
    enrollments,
    active: enrollments.filter((item) => item.status === "active"),
    completed: enrollments.filter((item) => item.status === "completed"),
  });
};

const Review = require("../model/review");
const Course = require("../model/course");
const Enrollment = require("../model/enrollment");
const { success, failure } = require("../utils/apiResponse");

const refreshRating = async (courseId) => {
  const [summary] = await Review.aggregate([
    { $match: { course: courseId, isApproved: true } },
    {
      $group: {
        _id: "$course",
        rating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  await Course.updateOne(
    { _id: courseId },
    {
      rating: summary ? Number(summary.rating.toFixed(2)) : 0,
      reviewCount: summary ? summary.count : 0,
    },
  );
};
exports.list = async (req, res) =>
  success(
    res,
    200,
    "Reviews retrieved",
    await Review.find({ course: req.params.courseId, isApproved: true })
      .populate("student", "fullName avatar")
      .sort({ createdAt: -1 }),
  );
exports.create = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment)
    return failure(
      res,
      403,
      "You must be enrolled to review this course",
      "REVIEW_ENROLLMENT_REQUIRED",
    );
  try {
    const review = await Review.create({
      course: req.params.courseId,
      student: req.user._id,
      enrollment: enrollment._id,
      title: req.body.title,
      content: req.body.content,
      rating: req.body.rating,
    });
    await refreshRating(enrollment.course);
    return success(res, 201, "Review submitted", review);
  } catch (error) {
    if (error.code === 11000)
      return failure(
        res,
        409,
        "You have already reviewed this course",
        "REVIEW_DUPLICATE",
      );
    throw error;
  }
};
exports.update = async (req, res) => {
  const review = await Review.findOneAndUpdate(
    { _id: req.params.reviewId, student: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!review) return failure(res, 404, "Review not found", "REVIEW_NOT_FOUND");
  await refreshRating(review.course);
  return success(res, 200, "Review updated", review);
};
exports.remove = async (req, res) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.reviewId,
    ...(req.user.role === "admin" ? {} : { student: req.user._id }),
  });
  if (!review) return failure(res, 404, "Review not found", "REVIEW_NOT_FOUND");
  await refreshRating(review.course);
  return success(res, 200, "Review deleted");
};

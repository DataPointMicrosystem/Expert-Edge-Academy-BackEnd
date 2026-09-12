const WishlistItem = require("../model/wishlistItem");
const Course = require("../model/course");
const { success, failure } = require("../utils/apiResponse");

exports.list = async (req, res) =>
  success(
    res,
    200,
    "Wishlist retrieved",
    await WishlistItem.find({ user: req.user._id })
      .populate("course")
      .sort({ createdAt: -1 }),
  );
exports.add = async (req, res) => {
  if (!(await Course.exists({ _id: req.params.courseId, status: "published" })))
    return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  try {
    return success(
      res,
      201,
      "Course added to wishlist",
      await WishlistItem.create({
        user: req.user._id,
        course: req.params.courseId,
      }),
    );
  } catch (error) {
    if (error.code === 11000)
      return failure(
        res,
        409,
        "Course is already in your wishlist",
        "WISHLIST_DUPLICATE",
      );
    throw error;
  }
};
exports.remove = async (req, res) => {
  await WishlistItem.deleteOne({
    user: req.user._id,
    course: req.params.courseId,
  });
  return success(res, 200, "Course removed from wishlist");
};

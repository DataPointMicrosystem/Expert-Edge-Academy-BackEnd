const CartItem = require("../model/cartItem");
const Course = require("../model/course");
const Enrollment = require("../model/enrollment");
const { success, failure } = require("../utils/apiResponse");

exports.get = async (req, res) => {
  const items = await CartItem.find({ user: req.user._id })
    .populate({
      path: "course",
      populate: { path: "instructor", select: "fullName" },
    })
    .sort({ createdAt: -1 });
  return success(res, 200, "Cart retrieved", {
    items,
    totalItems: items.length,
    totalPrice: items.reduce((sum, item) => sum + item.price, 0),
  });
};

exports.add = async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.courseId,
    status: "published",
  });
  if (!course)
    return failure(res, 404, "Published course not found", "COURSE_NOT_FOUND");
  if (await Enrollment.exists({ student: req.user._id, course: course._id }))
    return failure(
      res,
      409,
      "You are already enrolled in this course",
      "ALREADY_ENROLLED",
    );
  try {
    const item = await CartItem.create({
      user: req.user._id,
      course: course._id,
      price: course.price,
    });
    return success(res, 201, "Course added to cart", item);
  } catch (error) {
    if (error.code === 11000)
      return failure(
        res,
        409,
        "Course is already in your cart",
        "CART_DUPLICATE",
      );
    throw error;
  }
};

exports.remove = async (req, res) => {
  await CartItem.deleteOne({ user: req.user._id, course: req.params.courseId });
  return success(res, 200, "Course removed from cart");
};
exports.clear = async (req, res) => {
  await CartItem.deleteMany({ user: req.user._id });
  return success(res, 200, "Cart cleared");
};

const Category = require("../model/category");
const Course = require("../model/course");
const { success, failure } = require("../utils/apiResponse");
const slugify = require("../utils/slugify");

exports.list = async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();
  const counts = await Course.aggregate([
    { $match: { status: "published" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((item) => [String(item._id), item.count]));
  return success(
    res,
    200,
    "Categories retrieved",
    categories.map((category) => ({
      ...category,
      courseCount: map.get(String(category._id)) || 0,
    })),
  );
};

exports.create = async (req, res) => {
  if (!req.body.name)
    return failure(res, 400, "Category name is required", "VALIDATION_ERROR");
  const category = await Category.create({
    ...req.body,
    slug: req.body.slug || slugify(req.body.name),
  });
  return success(res, 201, "Category created", category);
};

exports.update = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.categoryId,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!category)
    return failure(res, 404, "Category not found", "CATEGORY_NOT_FOUND");
  return success(res, 200, "Category updated", category);
};

exports.remove = async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.categoryId,
    { isActive: false },
    { new: true },
  );
  if (!category)
    return failure(res, 404, "Category not found", "CATEGORY_NOT_FOUND");
  return success(res, 200, "Category deactivated");
};

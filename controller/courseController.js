const Course = require("../model/course");
const Section = require("../model/section");
const Lesson = require("../model/lesson");
const Category = require("../model/category");
const AdminAction = require("../model/adminAction");
const User = require("../model/user");
const { success, failure } = require("../utils/apiResponse");
const slugify = require("../utils/slugify");

const ownerOrAdmin = (course, user) =>
  user.role === "admin" || String(course.instructor) === String(user._id);
const publishedFilter = { status: "published" };

exports.list = async (req, res) => {
  const {
    search,
    category,
    instructor,
    level,
    minPrice,
    maxPrice,
    minRating,
    isFree,
    sort = "newest",
    featured,
    trending,
  } = req.query;
  const filter = { ...publishedFilter };
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (instructor) filter.instructor = instructor;
  if (level) filter.level = level;
  if (minPrice || maxPrice)
    filter.price = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (isFree === "true") filter.price = 0;
  if (featured === "true") filter.featured = true;
  if (trending === "true") filter.trending = true;
  const sortMap = {
    newest: { createdAt: -1 },
    popular: { enrollmentCount: -1 },
    rating: { rating: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
  };
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "fullName avatar bio")
      .populate("category", "name slug")
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);
  return success(res, 200, "Courses retrieved", items, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
};

exports.getBySlug = async (req, res) => {
  const course = await Course.findOne({
    slug: req.params.slug,
    ...publishedFilter,
  })
    .populate("instructor", "fullName avatar bio")
    .populate("category", "name slug");
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  await Course.updateOne({ _id: course._id }, { $inc: { viewCount: 1 } });
  const sections = await Section.find({ course: course._id })
    .sort({ order: 1 })
    .lean();
  const lessons = await Lesson.find({ course: course._id, isPublished: true })
    .sort({ order: 1 })
    .lean();
  return success(res, 200, "Course retrieved", {
    course,
    sections: sections.map((section) => ({
      ...section,
      lessons: lessons.filter(
        (lesson) => String(lesson.section) === String(section._id),
      ),
    })),
  });
};

exports.create = async (req, res) => {
  const {
    title,
    shortDescription,
    description,
    category,
    level,
    language,
    price,
    originalPrice,
    thumbnail,
    learningOutcomes,
    requirements,
    prerequisites,
  } = req.body;
  if (!title || !shortDescription || !description || !category || !level)
    return failure(
      res,
      400,
      "Required course fields are missing",
      "VALIDATION_ERROR",
    );
  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const course = await Course.create({
    title,
    slug,
    shortDescription,
    description,
    instructor: req.user._id,
    category,
    level,
    language,
    price: Number(price) || 0,
    originalPrice,
    thumbnail,
    learningOutcomes,
    requirements,
    prerequisites,
  });
  return success(res, 201, "Course draft created", course);
};

exports.update = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  if (!ownerOrAdmin(course, req.user))
    return failure(res, 403, "You do not own this course", "COURSE_FORBIDDEN");
  if (course.status === "published" && req.user.role !== "admin")
    return failure(
      res,
      409,
      "Published courses require an admin update workflow",
      "COURSE_PUBLISHED_LOCKED",
    );
  const allowed = [
    "title",
    "shortDescription",
    "description",
    "category",
    "level",
    "language",
    "price",
    "originalPrice",
    "thumbnail",
    "learningOutcomes",
    "requirements",
    "prerequisites",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });
  if (course.status === "rejected" && req.user.role !== "admin") {
    course.status = "draft";
    course.rejectionReason = undefined;
  }
  await course.save();
  return success(res, 200, "Course updated", course);
};

exports.remove = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  if (!ownerOrAdmin(course, req.user))
    return failure(res, 403, "You do not own this course", "COURSE_FORBIDDEN");
  course.status = "archived";
  course.isPublished = false;
  await course.save();
  return success(res, 200, "Course archived");
};

exports.submitForReview = async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.courseId,
    instructor: req.user._id,
  });
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  if (!["draft", "rejected"].includes(course.status))
    return failure(
      res,
      409,
      "Course cannot be submitted in its current state",
      "INVALID_COURSE_STATUS",
    );
  course.status = "pending_review";
  course.rejectionReason = undefined;
  await course.save();
  return success(res, 200, "Course submitted for review", course);
};

exports.instructorCourses = async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .populate("category", "name slug")
    .sort({ updatedAt: -1 });
  return success(res, 200, "Instructor courses retrieved", courses);
};

exports.createSection = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || !ownerOrAdmin(course, req.user))
    return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  const section = await Section.create({
    course: course._id,
    title: req.body.title,
    description: req.body.description,
    order: req.body.order,
  });
  return success(res, 201, "Section created", section);
};

exports.createLesson = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  const section = await Section.findOne({
    _id: req.params.sectionId,
    course: req.params.courseId,
  });
  if (!course || !section || !ownerOrAdmin(course, req.user))
    return failure(
      res,
      404,
      "Course or section not found",
      "CONTENT_NOT_FOUND",
    );
  const lesson = await Lesson.create({
    course: course._id,
    section: section._id,
    ...req.body,
  });
  return success(res, 201, "Lesson created", lesson);
};

exports.adminReview = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  const { approved, rejectionReason } = req.body;
  if (approved === true) {
    course.status = "approved";
    course.rejectionReason = undefined;
  } else {
    course.status = "rejected";
    course.rejectionReason =
      rejectionReason || "Course requires changes before approval";
  }
  await course.save();
  await AdminAction.create({
    admin: req.user._id,
    action: approved ? "course_approved" : "course_rejected",
    targetType: "course",
    targetId: course._id,
    details: { rejectionReason },
  });
  return success(
    res,
    200,
    approved ? "Course approved" : "Course rejected",
    course,
  );
};

exports.adminPublish = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  if (!["approved", "published"].includes(course.status))
    return failure(
      res,
      409,
      "Only approved courses can be published",
      "COURSE_NOT_APPROVED",
    );
  course.status = req.body.published === false ? "approved" : "published";
  course.publishedAt = course.status === "published" ? new Date() : undefined;
  await course.save();
  return success(
    res,
    200,
    `Course ${course.status === "published" ? "published" : "unpublished"}`,
    course,
  );
};

exports.adminList = async (req, res) => {
  const courses = await Course.find({
    status: req.query.status || "pending_review",
  })
    .populate("instructor", "fullName email")
    .sort({ createdAt: 1 });
  return success(res, 200, "Courses retrieved", courses);
};

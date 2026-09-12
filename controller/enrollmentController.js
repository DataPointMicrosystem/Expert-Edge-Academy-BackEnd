const Course = require("../model/course");
const Enrollment = require("../model/enrollment");
const Section = require("../model/section");
const Lesson = require("../model/lesson");
const LessonProgress = require("../model/lessonProgress");
const User = require("../model/user");
const { success, failure } = require("../utils/apiResponse");
const { notify } = require("../services/notificationService");
const { issueForEnrollment } = require("../services/certificateService");

const prerequisitesComplete = async (courseId, studentId) => {
  const course = await Course.findById(courseId).select("prerequisites");
  if (!course || !course.prerequisites.length) return true;
  const completed = await Enrollment.countDocuments({
    student: studentId,
    course: { $in: course.prerequisites },
    status: "completed",
  });
  return completed === course.prerequisites.length;
};

exports.freeEnroll = async (req, res) => {
  const course = await Course.findOne({
    _id: req.params.courseId,
    status: "published",
  });
  if (!course)
    return failure(res, 404, "Published course not found", "COURSE_NOT_FOUND");
  if (course.price > 0)
    return failure(
      res,
      409,
      "This course requires payment",
      "PAYMENT_REQUIRED",
    );
  if (!(await prerequisitesComplete(course._id, req.user._id)))
    return failure(
      res,
      403,
      "Complete prerequisite courses first",
      "PREREQUISITES_NOT_MET",
    );
  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (existing)
    return failure(
      res,
      409,
      "You are already enrolled in this course",
      "ALREADY_ENROLLED",
    );
  const totalLessons = await Lesson.countDocuments({
    course: course._id,
    isPublished: true,
  });
  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: course._id,
    type: "free",
    totalLessons,
  });
  await Course.updateOne({ _id: course._id }, { $inc: { enrollmentCount: 1 } });
  await notify({
    user: req.user._id,
    type: "enrollment",
    title: "Enrollment confirmed",
    message: `You are enrolled in ${course.title}.`,
    data: { courseId: course._id },
  });
  return success(res, 201, "Enrollment created", enrollment);
};

exports.myEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    ...(req.query.status ? { status: req.query.status } : {}),
  })
    .populate({
      path: "course",
      populate: [
        { path: "instructor", select: "fullName avatar" },
        { path: "category", select: "name slug" },
      ],
    })
    .sort({ updatedAt: -1 });
  return success(res, 200, "Enrollments retrieved", enrollments);
};

exports.getEnrollment = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.enrollmentId,
    student: req.user._id,
  }).populate("course");
  if (!enrollment)
    return failure(res, 404, "Enrollment not found", "ENROLLMENT_NOT_FOUND");
  const [sections, lessons, progress] = await Promise.all([
    Section.find({ course: enrollment.course._id }).sort({ order: 1 }),
    Lesson.find({ course: enrollment.course._id, isPublished: true }).sort({
      order: 1,
    }),
    LessonProgress.find({ enrollment: enrollment._id }),
  ]);
  return success(res, 200, "Enrollment retrieved", {
    enrollment,
    sections,
    lessons,
    progress,
  });
};

exports.updateProgress = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.enrollmentId,
    student: req.user._id,
  }).populate("course");
  if (!enrollment)
    return failure(res, 404, "Enrollment not found", "ENROLLMENT_NOT_FOUND");
  const lesson = await Lesson.findOne({
    _id: req.body.lessonId,
    course: enrollment.course._id,
    isPublished: true,
  });
  if (!lesson) return failure(res, 404, "Lesson not found", "LESSON_NOT_FOUND");
  const progress = await LessonProgress.findOneAndUpdate(
    { enrollment: enrollment._id, lesson: lesson._id },
    {
      $set: {
        course: enrollment.course._id,
        isCompleted: Boolean(req.body.isCompleted),
        watchedDuration: Math.max(0, Number(req.body.watchedDuration) || 0),
        ...(req.body.isCompleted ? { completedAt: new Date() } : {}),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  const completedLessons = await LessonProgress.countDocuments({
    enrollment: enrollment._id,
    isCompleted: true,
  });
  const totalLessons = await Lesson.countDocuments({
    course: enrollment.course._id,
    isPublished: true,
  });
  const percentage = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;
  enrollment.completedLessons = completedLessons;
  enrollment.totalLessons = totalLessons;
  enrollment.progressPercentage = percentage;
  enrollment.lastLesson = lesson._id;
  enrollment.lastAccessedAt = new Date();
  if (percentage === 100 && enrollment.status !== "completed") {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
    await Course.updateOne(
      { _id: enrollment.course._id },
      { $inc: { completionCount: 1 } },
    );
    const student = await User.findById(req.user._id);
    await issueForEnrollment(enrollment, student, enrollment.course);
    await notify({
      user: req.user._id,
      type: "course_completion",
      title: "Course completed",
      message: `You completed ${enrollment.course.title}.`,
      data: { courseId: enrollment.course._id },
    });
  }
  await enrollment.save();
  return success(res, 200, "Progress updated", {
    enrollment,
    lessonProgress: progress,
  });
};

exports.checkAccess = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
    status: { $in: ["active", "completed"] },
  });
  if (!enrollment)
    return failure(res, 403, "Enrollment required", "COURSE_ACCESS_DENIED");
  return success(res, 200, "Course access granted", enrollment);
};

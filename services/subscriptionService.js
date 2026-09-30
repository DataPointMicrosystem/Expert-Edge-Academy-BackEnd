const crypto = require("crypto");
const Subscription = require("../model/subscription");
const Enrollment = require("../model/enrollment");
const Course = require("../model/course");
const Lesson = require("../model/lesson");
const paymentService = require("./paymentService");

const addMonths = (date, months) => {
  const result = new Date(date);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
};

const verifyWebhookSignature = (payload, signature) => {
  const secret =
    process.env.KORA_WEBHOOK_SECRET ||
    process.env.KORAPAY_WEBHOOK_SECRET ||
    process.env.KORA_SECRET_KEY ||
    process.env.KORAPAY_SECRET_KEY;
  if (!secret || typeof signature !== "string") return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload || {}))
    .digest("hex");
  const supplied = Buffer.from(signature);
  const expected = Buffer.from(digest);
  return (
    supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected)
  );
};

const matchesPayment = (subscription, transaction) =>
  Number(transaction.amount) === Number(subscription.amount) &&
  String(transaction.currency || "NGN").toUpperCase() === subscription.currency;

const activate = async (subscription, transaction) => {
  if (subscription.status === "active") {
    await ensureLearningEnrollments(subscription);
    return subscription;
  }
  if (subscription.status !== "pending") return subscription;

  const startedAt = new Date();
  const activated = await Subscription.findOneAndUpdate(
    { _id: subscription._id, status: "pending" },
    {
      $set: {
        status: "active",
        startedAt,
        renewalDate: addMonths(startedAt, subscription.durationMonths),
        completedAt: startedAt,
        providerTransactionId: String(transaction.id || ""),
        providerResponse: transaction,
      },
    },
    { new: true },
  );
  const result = activated || (await Subscription.findById(subscription._id));
  if (result?.status === "active") await ensureLearningEnrollments(result);
  return result;
};

const ensureLearningEnrollments = async (subscription) => {
  for (const courseId of subscription.includedCourses || []) {
    if (
      await Enrollment.exists({
        student: subscription.student,
        course: courseId,
      })
    )
      continue;
    const totalLessons = await Lesson.countDocuments({
      course: courseId,
      isPublished: true,
    });
    try {
      await Enrollment.create({
        student: subscription.student,
        course: courseId,
        type: "subscription",
        subscription: subscription._id,
        totalLessons,
      });
      await Course.updateOne(
        { _id: courseId },
        { $inc: { enrollmentCount: 1 } },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
};

const hasCourseAccess = async (studentId, courseId, now = new Date()) => {
  const enrollment = await Enrollment.exists({
    student: studentId,
    course: courseId,
    type: { $ne: "subscription" },
    status: { $in: ["active", "completed"] },
  });
  if (enrollment) return { allowed: true, source: "enrollment" };

  const subscription = await Subscription.findOne({
    student: studentId,
    status: "active",
    renewalDate: { $gt: now },
    includedCourses: courseId,
  }).select("_id");
  return subscription
    ? { allowed: true, source: "subscription" }
    : { allowed: false, source: null };
};

const expireCurrent = async (studentId, now = new Date()) => {
  await Subscription.updateMany(
    {
      student: studentId,
      status: "active",
      renewalDate: { $lte: now },
    },
    { $set: { status: "expired" }, $unset: { currentKey: 1 } },
  );
};

exports.addMonths = addMonths;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.matchesPayment = matchesPayment;
exports.activate = activate;
exports.ensureLearningEnrollments = ensureLearningEnrollments;
exports.hasCourseAccess = hasCourseAccess;
exports.expireCurrent = expireCurrent;
exports.paymentStatus = (transaction) => {
  if (paymentService.isPending(transaction)) return "pending";
  return String(transaction.status).toLowerCase() === "abandoned"
    ? "abandoned"
    : "failed";
};

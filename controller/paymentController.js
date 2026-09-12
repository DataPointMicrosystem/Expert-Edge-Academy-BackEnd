const crypto = require("crypto");
const Course = require("../model/course");
const Payment = require("../model/payment");
const Enrollment = require("../model/enrollment");
const Lesson = require("../model/lesson");
const paymentService = require("../services/paymentService");
const { notify } = require("../services/notificationService");
const referralService = require("../services/referralService");
const { success, failure } = require("../utils/apiResponse");

const feePercentage = () => Number(process.env.PLATFORM_FEE_PERCENTAGE || 15);
const paymentMatches = (payment, transaction) =>
  Number(transaction.amount) === Number(payment.amount) &&
  String(transaction.currency || "NGN").toUpperCase() === payment.currency;

const statusForTransaction = (transaction) => {
  if (paymentService.isPending(transaction)) return "pending";
  if (String(transaction.status).toLowerCase() === "abandoned")
    return "abandoned";
  return "failed";
};

const createEnrollment = async (payment, course) => {
  let enrollment = await Enrollment.findOne({
    student: payment.student,
    course: payment.course,
  });
  if (!enrollment) {
    try {
      enrollment = await Enrollment.create({
        student: payment.student,
        course: payment.course,
        type: "paid",
        payment: payment._id,
        totalLessons: await Lesson.countDocuments({
          course: course._id,
          isPublished: true,
        }),
      });
      await Course.updateOne(
        { _id: course._id },
        { $inc: { enrollmentCount: 1 } },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      enrollment = await Enrollment.findOne({
        student: payment.student,
        course: payment.course,
      });
    }
  }
  payment.enrollment = enrollment._id;
  await payment.save();
  return enrollment;
};

exports.initialize = async (req, res) => {
  const course = await Course.findOne({
    _id: req.body.courseId,
    status: "published",
  }).populate("instructor", "_id");
  if (!course)
    return failure(res, 404, "Published course not found", "COURSE_NOT_FOUND");
  if (course.price <= 0)
    return failure(
      res,
      409,
      "Use free enrollment for this course",
      "COURSE_IS_FREE",
    );
  if (await Enrollment.exists({ student: req.user._id, course: course._id }))
    return failure(res, 409, "You are already enrolled", "ALREADY_ENROLLED");
  if (req.body.referralCode) {
    await referralService.validateForUser({
      referralCode: req.body.referralCode,
      referredUserId: req.user._id,
    });
  }
  const amount = course.price;
  const percentage = feePercentage();
  const platformFee = Number(((amount * percentage) / 100).toFixed(2));
  const reference = `EEA-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
  const payment = await Payment.create({
    student: req.user._id,
    course: course._id,
    instructor: course.instructor._id,
    reference,
    amount,
    platformFeePercentage: percentage,
    platformFee,
    instructorEarnings: Number((amount - platformFee).toFixed(2)),
  });
  try {
    await referralService.attachToPayment({
      referralCode: req.body.referralCode,
      courseId: course._id,
      referredUserId: req.user._id,
      sessionId: req.body.referralSessionId || req.body.sessionId,
      paymentId: payment._id,
      paymentReference: reference,
    });
    const transaction = await paymentService.initialize({
      email: req.user.email,
      amount,
      reference,
      callbackUrl:
        req.body.callbackUrl || process.env.FRONTEND_PAYMENT_CALLBACK_URL,
      notificationUrl:
        process.env.PAYMENT_WEBHOOK_URL || process.env.KORAPAY_WEBHOOK_URL,
      metadata: {
        paymentId: payment._id.toString(),
        courseId: course._id.toString(),
        studentId: req.user._id.toString(),
      },
    });
    if (!transaction.checkout_url) {
      throw Object.assign(new Error("Kora did not return a checkout URL"), {
        statusCode: 502,
        code: "PAYMENT_CHECKOUT_UNAVAILABLE",
      });
    }
    return success(res, 200, "Payment initialized", {
      paymentId: payment._id,
      reference,
      authorizationUrl: transaction.checkout_url,
      provider: "kora",
    });
  } catch (error) {
    payment.status = "failed";
    await payment.save();
    throw error;
  }
};

exports.verify = async (req, res) => {
  const payment = await Payment.findOne({
    reference: req.params.reference,
    student: req.user._id,
  }).populate("course");
  if (!payment)
    return failure(
      res,
      404,
      "Payment transaction not found",
      "PAYMENT_NOT_FOUND",
    );
  if (payment.status === "successful")
    return success(res, 200, "Payment already verified", {
      payment,
      enrollmentId: payment.enrollment,
    });
  const transaction = await paymentService.verify(payment.reference);
  payment.providerTransactionId = String(transaction.id || "");
  payment.providerResponse = transaction;
  if (
    !paymentService.isSuccessful(transaction) ||
    !paymentMatches(payment, transaction)
  ) {
    payment.status = paymentMatches(payment, transaction)
      ? statusForTransaction(transaction)
      : "failed";
    await payment.save();
    if (payment.status === "pending") {
      return success(res, 202, "Payment is still pending", { payment });
    }
    return failure(
      res,
      402,
      "Payment was not successful",
      "PAYMENT_NOT_SUCCESSFUL",
    );
  }
  payment.status = "successful";
  payment.completedAt = new Date();
  await payment.save();
  const enrollment = await createEnrollment(payment, payment.course);
  await referralService.awardForPayment(payment);
  await notify({
    user: payment.student,
    type: "payment_success",
    title: "Payment successful",
    message: `Payment for ${payment.course.title} was successful.`,
    data: { paymentId: payment._id, courseId: payment.course._id },
  });
  return success(res, 200, "Payment verified and enrollment created", {
    payment,
    enrollment,
  });
};

exports.webhook = async (req, res) => {
  const signature = req.headers["x-korapay-signature"];
  const webhookSecret =
    process.env.KORA_WEBHOOK_SECRET ||
    process.env.KORAPAY_WEBHOOK_SECRET ||
    process.env.KORA_SECRET_KEY ||
    process.env.KORAPAY_SECRET_KEY;
  if (!webhookSecret || !signature)
    return res.status(401).json({ success: false, message: "Invalid webhook" });
  const event = Buffer.isBuffer(req.body)
    ? JSON.parse(req.body.toString("utf8"))
    : req.body;
  const payload = JSON.stringify(event.data || {});
  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");
  const validSignature =
    hash.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  if (!validSignature)
    return res
      .status(401)
      .json({ success: false, message: "Invalid webhook signature" });
  const transaction = event.data || {};
  const payment = await Payment.findOne({
    reference: transaction.reference,
  }).populate("course");
  if (
    payment &&
    event.event === "charge.success" &&
    payment.status !== "successful"
  ) {
    const verifiedTransaction = await paymentService.verify(payment.reference);
    if (
      !paymentService.isSuccessful(verifiedTransaction) ||
      !paymentMatches(payment, verifiedTransaction)
    ) {
      return res.status(200).json({ success: true, ignored: true });
    }
    payment.status = "successful";
    payment.providerTransactionId = String(
      verifiedTransaction.id || transaction.id || "",
    );
    payment.providerResponse = verifiedTransaction;
    payment.completedAt = new Date();
    await payment.save();
    await createEnrollment(payment, payment.course);
    await referralService.awardForPayment(payment);
  } else if (
    payment &&
    event.event === "charge.failed" &&
    payment.status === "pending"
  ) {
    payment.status =
      transaction.status === "abandoned" ? "abandoned" : "failed";
    payment.providerResponse = transaction;
    await payment.save();
  }
  return res.status(200).json({ success: true });
};

exports.history = async (req, res) =>
  success(
    res,
    200,
    "Payment history retrieved",
    await Payment.find({ student: req.user._id })
      .populate("course", "title thumbnail price")
      .sort({ createdAt: -1 }),
  );

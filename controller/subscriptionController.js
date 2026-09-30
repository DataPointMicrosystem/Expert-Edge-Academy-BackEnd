const crypto = require("crypto");
const mongoose = require("mongoose");
const Course = require("../model/course");
const Subscription = require("../model/subscription");
const SubscriptionPlan = require("../model/subscriptionPlan");
const paymentService = require("../services/paymentService");
const subscriptionService = require("../services/subscriptionService");
const { success, failure } = require("../utils/apiResponse");

const activePlanData = (plan) => ({
  planId: plan.planId,
  name: plan.name,
  description: plan.description,
  amount: plan.amount,
  price: plan.amount,
  currency: "NGN",
  durationMonths: plan.durationMonths,
  courses: plan.courses,
  benefits: plan.benefits,
});

exports.plans = async (_req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true })
    .populate("courses", "title slug")
    .sort({ amount: 1 })
    .lean();
  return success(
    res,
    200,
    "Subscription plans retrieved",
    plans.map(activePlanData),
  );
};

exports.adminPlans = async (_req, res) => {
  const plans = await SubscriptionPlan.find()
    .populate("courses", "title slug")
    .sort({ createdAt: -1 })
    .lean();
  return success(res, 200, "Subscription plans retrieved", plans);
};

exports.createPlan = async (req, res) => {
  const {
    planId,
    name,
    description,
    amount,
    durationMonths,
    courseIds,
    benefits,
  } = req.body;
  const validation = validatePlan({
    planId,
    name,
    amount,
    durationMonths,
    courseIds,
  });
  if (validation) return failure(res, 400, validation, "VALIDATION_ERROR");
  const courses = await resolveCourses(courseIds);
  if (!courses)
    return failure(
      res,
      400,
      "One or more courses do not exist",
      "INVALID_COURSES",
    );
  let plan;
  try {
    plan = await SubscriptionPlan.create({
      planId: planId.toLowerCase(),
      name,
      description,
      amount,
      durationMonths,
      courses,
      benefits,
    });
  } catch (error) {
    if (error.code === 11000)
      return failure(
        res,
        409,
        "A plan with this planId already exists",
        "PLAN_ID_TAKEN",
      );
    throw error;
  }
  return success(res, 201, "Subscription plan created", plan);
};

exports.updatePlan = async (req, res) => {
  const updates = {};
  for (const key of [
    "name",
    "description",
    "amount",
    "durationMonths",
    "benefits",
    "isActive",
  ])
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (req.body.courseIds !== undefined) {
    if (!Array.isArray(req.body.courseIds) || !req.body.courseIds.length)
      return failure(
        res,
        400,
        "courseIds must be a non-empty array",
        "VALIDATION_ERROR",
      );
    const courses = await resolveCourses(req.body.courseIds);
    if (!courses)
      return failure(
        res,
        400,
        "One or more courses do not exist",
        "INVALID_COURSES",
      );
    updates.courses = courses;
  }
  if (
    updates.amount !== undefined &&
    (!Number.isFinite(updates.amount) || updates.amount < 1)
  )
    return failure(
      res,
      400,
      "amount must be a positive number",
      "VALIDATION_ERROR",
    );
  if (
    updates.durationMonths !== undefined &&
    (!Number.isInteger(updates.durationMonths) ||
      updates.durationMonths < 1 ||
      updates.durationMonths > 36)
  )
    return failure(
      res,
      400,
      "durationMonths must be between 1 and 36",
      "VALIDATION_ERROR",
    );
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { planId: req.params.planId.toLowerCase() },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!plan)
    return failure(res, 404, "Subscription plan not found", "PLAN_NOT_FOUND");
  return success(res, 200, "Subscription plan updated", plan);
};

exports.archivePlan = async (req, res) => {
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { planId: req.params.planId.toLowerCase(), isActive: true },
    { $set: { isActive: false } },
    { new: true },
  );
  if (!plan)
    return failure(
      res,
      404,
      "Active subscription plan not found",
      "PLAN_NOT_FOUND",
    );
  return success(res, 200, "Subscription plan archived", plan);
};

exports.current = async (req, res) => {
  const now = new Date();
  await subscriptionService.expireCurrent(req.user._id, now);
  const record = await Subscription.findOne({ student: req.user._id }).sort({
    createdAt: -1,
  });
  if (!record)
    return success(res, 200, "No subscription found", {
      subscription: null,
      entitlement: { active: false, courses: [] },
    });
  const status =
    record.status === "active" && record.renewalDate <= now
      ? "expired"
      : record.status;
  const active = status === "active" && record.renewalDate > now;
  const courses = active
    ? await Course.find({ _id: { $in: record.includedCourses } })
        .select("_id slug title")
        .lean()
    : [];
  return success(res, 200, "Subscription retrieved", {
    subscription: {
      planId: record.planId,
      planName: record.planName,
      status,
      startedAt: record.startedAt || null,
      renewalDate: record.renewalDate || null,
      ...(status === "pending" && record.authorizationUrl
        ? { authorizationUrl: record.authorizationUrl }
        : {}),
      amount: record.amount,
      currency: record.currency,
      reference: record.reference,
    },
    entitlement: { active, courses },
  });
};

exports.initialize = async (req, res) => {
  const planId =
    typeof req.body.planId === "string"
      ? req.body.planId.trim().toLowerCase()
      : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(planId))
    return failure(res, 400, "A valid planId is required", "VALIDATION_ERROR");
  const plan = await SubscriptionPlan.findOne({ planId, isActive: true });
  if (!plan)
    return failure(res, 404, "Subscription plan not found", "PLAN_NOT_FOUND");

  const now = new Date();
  await subscriptionService.expireCurrent(req.user._id, now);
  const existing = await Subscription.findOne({
    student: req.user._id,
    status: { $in: ["pending", "active"] },
  });
  if (existing)
    return failure(
      res,
      409,
      "An active subscription or pending purchase already exists",
      "SUBSCRIPTION_ALREADY_EXISTS",
    );

  const reference = `EES-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  let subscription;
  try {
    subscription = await Subscription.create({
      student: req.user._id,
      currentKey: req.user._id,
      plan: plan._id,
      planId: plan.planId,
      planName: plan.name,
      includedCourses: plan.courses,
      durationMonths: plan.durationMonths,
      reference,
      amount: plan.amount,
      currency: "NGN",
    });
  } catch (error) {
    if (error.code === 11000)
      return failure(
        res,
        409,
        "An active subscription or pending purchase already exists",
        "SUBSCRIPTION_ALREADY_EXISTS",
      );
    throw error;
  }

  try {
    const transaction = await paymentService.initialize({
      email: req.user.email,
      amount: subscription.amount,
      reference,
      callbackUrl:
        req.body.callbackUrl || process.env.FRONTEND_PAYMENT_CALLBACK_URL,
      notificationUrl:
        process.env.SUBSCRIPTION_WEBHOOK_URL ||
        process.env.PAYMENT_WEBHOOK_URL ||
        process.env.KORAPAY_WEBHOOK_URL,
      metadata: {
        subscriptionId: subscription._id.toString(),
        planId: subscription.planId,
        studentId: req.user._id.toString(),
      },
    });
    if (!transaction.checkout_url)
      throw Object.assign(new Error("Kora did not return a checkout URL"), {
        statusCode: 502,
        code: "PAYMENT_CHECKOUT_UNAVAILABLE",
      });
    subscription.authorizationUrl = transaction.checkout_url;
    await subscription.save();
    return success(res, 200, "Subscription payment initialized", {
      subscriptionId: subscription._id,
      planId: subscription.planId,
      reference,
      authorizationUrl: transaction.checkout_url,
      provider: "kora",
    });
  } catch (error) {
    await Subscription.updateOne(
      { _id: subscription._id, status: "pending" },
      { $set: { status: "failed" }, $unset: { currentKey: 1 } },
    );
    throw error;
  }
};

exports.verify = async (req, res) => {
  const subscription = await Subscription.findOne({
    reference: req.params.reference,
    student: req.user._id,
  });
  if (!subscription)
    return failure(
      res,
      404,
      "Subscription payment not found",
      "SUBSCRIPTION_NOT_FOUND",
    );
  if (subscription.status === "active")
    return success(
      res,
      200,
      "Subscription payment already verified",
      subscriptionPayload(await subscriptionService.activate(subscription, {})),
    );
  if (subscription.status !== "pending")
    return failure(
      res,
      402,
      "Subscription payment was not successful",
      "PAYMENT_NOT_SUCCESSFUL",
    );

  const transaction = await paymentService.verify(subscription.reference);
  if (!subscriptionService.matchesPayment(subscription, transaction)) {
    await failSubscription(subscription, transaction, "failed");
    return failure(
      res,
      402,
      "Payment amount or currency did not match",
      "PAYMENT_MISMATCH",
    );
  }
  if (!paymentService.isSuccessful(transaction)) {
    const status = subscriptionService.paymentStatus(transaction);
    if (status !== "pending")
      await failSubscription(subscription, transaction, status);
    if (status === "pending")
      return success(res, 202, "Payment is still pending", {
        status,
        reference: subscription.reference,
      });
    return failure(
      res,
      402,
      "Subscription payment was not successful",
      "PAYMENT_NOT_SUCCESSFUL",
    );
  }
  const active = await subscriptionService.activate(subscription, transaction);
  return success(
    res,
    200,
    "Subscription activated",
    subscriptionPayload(active),
  );
};

exports.webhook = async (req, res) => {
  const signature = req.headers["x-korapay-signature"];
  let event;
  try {
    event = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString("utf8"))
      : req.body;
  } catch (_error) {
    return failure(
      res,
      400,
      "Invalid webhook payload",
      "INVALID_WEBHOOK_PAYLOAD",
    );
  }
  if (
    !event ||
    !subscriptionService.verifyWebhookSignature(event.data, signature)
  )
    return failure(
      res,
      401,
      "Invalid webhook signature",
      "INVALID_WEBHOOK_SIGNATURE",
    );
  const transaction = event.data;
  if (!transaction || typeof transaction.reference !== "string")
    return failure(
      res,
      400,
      "Webhook reference is missing",
      "INVALID_WEBHOOK_PAYLOAD",
    );
  const subscription = await Subscription.findOne({
    reference: transaction.reference,
  });
  if (!subscription)
    return res.status(200).json({ success: true, ignored: true });
  if (subscription.status !== "pending") {
    if (subscription.status === "active")
      await subscriptionService.activate(subscription, {});
    return res.status(200).json({ success: true, duplicate: true });
  }

  const verified = await paymentService.verify(subscription.reference);
  if (!subscriptionService.matchesPayment(subscription, verified)) {
    await failSubscription(subscription, verified, "failed");
    return res.status(200).json({ success: true, ignored: true });
  }
  if (
    event.event === "charge.success" &&
    paymentService.isSuccessful(verified)
  ) {
    await subscriptionService.activate(subscription, verified);
  } else if (
    event.event === "charge.failed" &&
    paymentService.isFailed(verified)
  ) {
    await failSubscription(
      subscription,
      verified,
      subscriptionService.paymentStatus(verified),
    );
  }
  return res.status(200).json({ success: true });
};

const validatePlan = ({ planId, name, amount, durationMonths, courseIds }) => {
  if (typeof planId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(planId))
    return "planId must be a stable lowercase identifier";
  if (typeof name !== "string" || !name.trim()) return "name is required";
  if (!Number.isFinite(amount) || amount < 1)
    return "amount must be a positive number";
  if (
    !Number.isInteger(durationMonths) ||
    durationMonths < 1 ||
    durationMonths > 36
  )
    return "durationMonths must be between 1 and 36";
  if (
    !Array.isArray(courseIds) ||
    !courseIds.length ||
    courseIds.some((id) => !mongoose.isValidObjectId(id))
  )
    return "courseIds must be a non-empty array of valid course IDs";
  return null;
};

const resolveCourses = async (courseIds) => {
  if (
    !Array.isArray(courseIds) ||
    !courseIds.length ||
    courseIds.some((id) => !mongoose.isValidObjectId(id))
  )
    return null;
  const courses = await Course.find({ _id: { $in: courseIds } }).select("_id");
  return courses.length === new Set(courseIds.map(String)).size
    ? courses.map((course) => course._id)
    : null;
};

const failSubscription = async (subscription, transaction, status) =>
  Subscription.updateOne(
    { _id: subscription._id, status: "pending" },
    {
      $set: { status, providerResponse: transaction },
      $unset: { currentKey: 1 },
    },
  );

const subscriptionPayload = (subscription) => ({
  subscriptionId: subscription._id,
  planId: subscription.planId,
  status: subscription.status,
  startedAt: subscription.startedAt,
  renewalDate: subscription.renewalDate,
  amount: subscription.amount,
  currency: subscription.currency,
  reference: subscription.reference,
});

const crypto = require("crypto");
const ReferralProfile = require("../model/referralProfile");
const ReferralAttribution = require("../model/referralAttribution");
const ReferralReward = require("../model/referralReward");
const User = require("../model/user");

const rewardAmount = () => Number(process.env.REFERRAL_REWARD_AMOUNT || 2500);

const generateCode = () => crypto.randomBytes(5).toString("hex").toUpperCase();

exports.getOrCreateProfile = async (userId) => {
  const existing = await ReferralProfile.findOne({ user: userId });
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await ReferralProfile.create({ user: userId, code: generateCode() });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const profile = await ReferralProfile.findOne({ user: userId });
      if (profile) return profile;
    }
  }
  throw Object.assign(new Error("Unable to create a unique referral code"), {
    statusCode: 503,
    code: "REFERRAL_CODE_UNAVAILABLE",
  });
};

exports.findCode = async (code) => {
  if (!code || typeof code !== "string") return null;
  return ReferralProfile.findOne({ code: code.trim().toUpperCase() });
};

exports.validateForUser = async ({ referralCode, referredUserId }) => {
  const profile = await exports.findCode(referralCode);
  if (!profile) {
    throw Object.assign(new Error("Referral code not found"), {
      statusCode: 400,
      code: "REFERRAL_CODE_NOT_FOUND",
    });
  }
  if (String(profile.user) === String(referredUserId)) {
    throw Object.assign(new Error("You cannot use your own referral code"), {
      statusCode: 400,
      code: "SELF_REFERRAL_NOT_ALLOWED",
    });
  }
  return profile;
};

exports.track = async ({ referralCode, courseId, referredUserId, sessionId }) => {
  const profile = await exports.findCode(referralCode);
  if (!profile) {
    throw Object.assign(new Error("Referral code not found"), {
      statusCode: 404,
      code: "REFERRAL_CODE_NOT_FOUND",
    });
  }
  if (referredUserId && String(profile.user) === String(referredUserId)) {
    throw Object.assign(new Error("You cannot use your own referral code"), {
      statusCode: 400,
      code: "SELF_REFERRAL_NOT_ALLOWED",
    });
  }

  const query = {
    referrer: profile.user,
    course: courseId,
    ...(referredUserId ? { referredUser: referredUserId } : { sessionId }),
  };
  const attribution = await ReferralAttribution.findOneAndUpdate(
    query,
    {
      $set: {
        referralCode: profile.code,
        referredUser: referredUserId,
        sessionId,
        lastTrackedAt: new Date(),
        status: "pending",
      },
      $setOnInsert: { referrer: profile.user, course: courseId },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return attribution;
};

exports.attachToPayment = async ({ referralCode, courseId, referredUserId, sessionId, paymentId, paymentReference }) => {
  if (!referralCode) {
    return ReferralAttribution.findOneAndUpdate(
      {
        course: courseId,
        status: "pending",
        $or: [
          ...(referredUserId ? [{ referredUser: referredUserId }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
      },
      { $set: { payment: paymentId, paymentReference, lastTrackedAt: new Date() } },
      { new: true },
    );
  }
  const profile = await exports.validateForUser({ referralCode, referredUserId });
  return ReferralAttribution.findOneAndUpdate(
    {
      referrer: profile.user,
      course: courseId,
      referredUser: referredUserId,
      status: "pending",
    },
    {
      $set: {
        referralCode: profile.code,
        payment: paymentId,
        paymentReference,
        lastTrackedAt: new Date(),
      },
      $setOnInsert: {
        referrer: profile.user,
        course: courseId,
        referredUser: referredUserId,
        sessionId,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

exports.awardForPayment = async (payment) => {
  if (!payment || payment.status !== "successful") return null;
  const existing = await ReferralReward.findOne({ payment: payment._id });
  if (existing) return existing;
  const attribution = await ReferralAttribution.findOne({
    $or: [{ payment: payment._id }, { paymentReference: payment.reference }],
    status: "pending",
  });
  if (!attribution || String(attribution.referrer) === String(payment.student)) return null;

  const referredUser = await User.findById(payment.student).select("_id");
  if (!referredUser || String(attribution.referrer) === String(referredUser._id)) return null;

  let reward;
  try {
    reward = await ReferralReward.create({
      referrer: attribution.referrer,
      referredUser: referredUser._id,
      course: payment.course,
      payment: payment._id,
      paymentReference: payment.reference,
      amount: rewardAmount(),
      status: "paid",
      paidAt: new Date(),
    });
  } catch (error) {
    if (error.code === 11000) return ReferralReward.findOne({ payment: payment._id });
    throw error;
  }
  await ReferralProfile.updateOne(
    { user: attribution.referrer },
    { $inc: { balance: reward.amount, totalEarned: reward.amount } },
  );
  attribution.status = "converted";
  attribution.payment = payment._id;
  attribution.paymentReference = payment.reference;
  await attribution.save();
  return reward;
};

exports.getSummary = async (userId) => {
  const profile = await exports.getOrCreateProfile(userId);
  const [paid, pendingAttributions, successfulReferrals, clicks] = await Promise.all([
    ReferralReward.aggregate([{ $match: { referrer: userId, status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ReferralAttribution.countDocuments({ referrer: userId, status: "pending", referredUser: { $exists: true } }),
    ReferralReward.countDocuments({ referrer: userId, status: "paid" }),
    ReferralAttribution.countDocuments({ referrer: userId }),
  ]);
  return {
    referralCode: profile.code,
    balance: profile.balance,
    totalEarned: paid[0]?.total || profile.totalEarned,
    pendingBalance: pendingAttributions * rewardAmount(),
    successfulReferrals,
    clicks,
  };
};

exports.getHistory = async ({ userId, page = 1, limit = 20 }) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = { referrer: userId };
  const [items, total] = await Promise.all([
    ReferralReward.find(filter)
      .populate("referredUser", "fullName")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip((normalizedPage - 1) * normalizedLimit)
      .limit(normalizedLimit),
    ReferralReward.countDocuments(filter),
  ]);
  return {
    items: items.map((item) => ({
      id: item._id,
      referredUser: item.referredUser && { id: item.referredUser._id, fullName: item.referredUser.fullName },
      course: item.course && { id: item.course._id, title: item.course.title },
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
    })),
    meta: { page: normalizedPage, limit: normalizedLimit, total, pages: Math.ceil(total / normalizedLimit) },
  };
};

exports.rewardAmount = rewardAmount;
exports.generateCode = generateCode;

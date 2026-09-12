const Course = require("../model/course");
const referralService = require("../services/referralService");
const { success, failure } = require("../utils/apiResponse");

exports.summary = async (req, res) =>
  success(res, 200, "Referral summary retrieved", await referralService.getSummary(req.user._id));

exports.code = async (req, res) => {
  const profile = await referralService.getOrCreateProfile(req.user._id);
  return success(res, 200, "Referral code retrieved", { referralCode: profile.code });
};

exports.track = async (req, res) => {
  const { referralCode, courseId, sessionId } = req.body;
  if (!referralCode || !courseId) {
    return failure(res, 400, "Referral code and course ID are required", "VALIDATION_ERROR");
  }
  if (!(await Course.exists({ _id: courseId, status: "published" }))) {
    return failure(res, 404, "Course not found", "COURSE_NOT_FOUND");
  }
  const attribution = await referralService.track({
    referralCode,
    courseId,
    referredUserId: req.user?._id,
    sessionId,
  });
  return success(res, 201, "Referral tracked", { attributionId: attribution._id, status: attribution.status });
};

exports.history = async (req, res) => {
  const result = await referralService.getHistory({ userId: req.user._id, page: req.query.page, limit: req.query.limit });
  return success(res, 200, "Referral history retrieved", result.items, result.meta);
};

exports.withdraw = async (req, res) =>
  failure(res, 501, "Referral withdrawals are not enabled yet", "REFERRAL_WITHDRAWALS_DISABLED");

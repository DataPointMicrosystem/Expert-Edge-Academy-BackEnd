const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const referralService = require("../services/referralService");
const { Authentication } = require("../middleware/auth");
const ReferralProfile = require("../model/referralProfile");
const ReferralAttribution = require("../model/referralAttribution");
const ReferralReward = require("../model/referralReward");
const User = require("../model/user");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const responseRecorder = () => {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      response.statusCode = code;
      return response;
    },
    json(body) {
      response.body = body;
      return response;
    },
  };
  return response;
};

test("referral codes are opaque uppercase values", () => {
  const code = referralService.generateCode();
  assert.match(code, /^[A-F0-9]{10}$/);
  assert.equal(code.includes(" "), false);
});

test("referral reward amount is configurable", () => {
  const previous = process.env.REFERRAL_REWARD_AMOUNT;
  process.env.REFERRAL_REWARD_AMOUNT = "3500";
  assert.equal(referralService.rewardAmount(), 3500);
  if (previous === undefined) delete process.env.REFERRAL_REWARD_AMOUNT;
  else process.env.REFERRAL_REWARD_AMOUNT = previous;
});

test("missing bearer token is rejected with 401", async () => {
  const response = responseRecorder();
  await Authentication({ headers: {} }, response, () => {
    throw new Error("next must not be called");
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "AUTH_TOKEN_MISSING");
});

test("self-referral validation rejects the owner's code", async () => {
  const originalFindCode = referralService.findCode;
  referralService.findCode = async () => ({ user: "user-1", code: "ABC1234567" });
  await assert.rejects(
    referralService.validateForUser({ referralCode: "ABC1234567", referredUserId: "user-1" }),
    (error) => error.code === "SELF_REFERRAL_NOT_ALLOWED" && error.statusCode === 400,
  );
  referralService.findCode = originalFindCode;
});

test("referral attribution is stored as pending and does not reward a click", async (t) => {
  t.mock.method(ReferralProfile, "findOne", async () => ({ user: "referrer-1", code: "ABC1234567" }));
  t.mock.method(ReferralAttribution, "findOneAndUpdate", async (query, update) => ({
    _id: "attribution-1",
    status: update.$set.status,
    referrer: query.referrer,
  }));
  const attribution = await referralService.track({ referralCode: "abc1234567", courseId: "course-1", sessionId: "session-1" });
  assert.equal(attribution.status, "pending");
  assert.equal(attribution.referrer, "referrer-1");
});

test("successful payment creates one referral reward and updates balance", async (t) => {
  let balanceUpdate;
  t.mock.method(ReferralReward, "findOne", async () => null);
  t.mock.method(ReferralAttribution, "findOne", async () => ({
    referrer: "referrer-1",
    status: "pending",
    save: async function save() { this.status = "converted"; },
  }));
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: "student-1" }) }));
  t.mock.method(ReferralReward, "create", async (value) => value);
  t.mock.method(ReferralProfile, "updateOne", async (_query, update) => { balanceUpdate = update; });
  const reward = await referralService.awardForPayment({
    _id: "payment-1",
    status: "successful",
    student: "student-1",
    course: "course-1",
    reference: "EEA-1",
  });
  assert.equal(reward.amount, referralService.rewardAmount());
  assert.equal(balanceUpdate.$inc.balance, reward.amount);
});

test("failed payments do not create referral rewards", async () => {
  const reward = await referralService.awardForPayment({ _id: "payment-failed", status: "failed" });
  assert.equal(reward, null);
});

test("duplicate payment reward returns the existing reward", async (t) => {
  const existing = { _id: "reward-1", amount: 2500 };
  t.mock.method(ReferralReward, "findOne", async () => existing);
  const reward = await referralService.awardForPayment({ _id: "payment-duplicate", status: "successful" });
  assert.equal(reward, existing);
});

test("referral summary returns balance and aggregate counts", async (t) => {
  t.mock.method(referralService, "getOrCreateProfile", async () => ({ code: "ABC1234567", balance: 2500, totalEarned: 2500 }));
  t.mock.method(ReferralReward, "aggregate", async (pipeline) => pipeline[0].$match.status === "paid" ? [{ total: 2500 }] : []);
  t.mock.method(ReferralReward, "countDocuments", async () => 1);
  t.mock.method(ReferralAttribution, "countDocuments", async (query) => query.status === "pending" ? 2 : 4);
  const summary = await referralService.getSummary("referrer-1");
  assert.deepEqual(summary, { referralCode: "ABC1234567", balance: 2500, totalEarned: 2500, pendingBalance: 5000, successfulReferrals: 1, clicks: 4 });
});

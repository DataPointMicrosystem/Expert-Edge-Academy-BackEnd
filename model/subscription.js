const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentKey: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true,
      sparse: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    planId: { type: String, required: true, index: true },
    planName: { type: String, required: true },
    billingInterval: {
      type: String,
      enum: ["one_time", "monthly", "quarterly", "annually"],
      default: "one_time",
    },
    planFeatures: [{ type: String }],
    includedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    durationMonths: { type: Number, required: true },
    reference: { type: String, required: true, unique: true, index: true },
    transactionType: {
      type: String,
      enum: ["subscription"],
      default: "subscription",
      required: true,
      index: true,
    },
    authorizationUrl: String,
    providerTransactionId: String,
    provider: { type: String, enum: ["kora"], default: "kora" },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "failed", "abandoned"],
      default: "pending",
      index: true,
    },
    startedAt: Date,
    renewalDate: Date,
    completedAt: Date,
    providerResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

subscriptionSchema.index({ student: 1, createdAt: -1 });
subscriptionSchema.index({ student: 1, status: 1, renewalDate: 1 });
module.exports = mongoose.model("Subscription", subscriptionSchema);

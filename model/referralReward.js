const mongoose = require("mongoose");

const referralRewardSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, unique: true, index: true },
    paymentReference: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "paid", index: true },
    paidAt: Date,
  },
  { timestamps: true },
);

referralRewardSchema.index({ referrer: 1, createdAt: -1 });
module.exports = mongoose.model("ReferralReward", referralRewardSchema);

const mongoose = require("mongoose");

const referralAttributionSchema = new mongoose.Schema(
  {
    referralCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    paymentReference: { type: String, index: true },
    sessionId: { type: String, index: true },
    status: { type: String, enum: ["pending", "converted", "invalid"], default: "pending", index: true },
    lastTrackedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

referralAttributionSchema.index({ referrer: 1, referredUser: 1, course: 1, status: 1 });
module.exports = mongoose.model("ReferralAttribution", referralAttributionSchema);

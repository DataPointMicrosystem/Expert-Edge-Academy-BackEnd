const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
    reference: { type: String, required: true, unique: true, index: true },
    providerTransactionId: String,
    provider: { type: String, enum: ["kora"], default: "kora" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    platformFeePercentage: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    instructorEarnings: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "abandoned"],
      default: "pending",
      index: true,
    },
    providerResponse: mongoose.Schema.Types.Mixed,
    completedAt: Date,
  },
  { timestamps: true },
);

paymentSchema.index({ student: 1, createdAt: -1 });
module.exports = mongoose.model("Payment", paymentSchema);

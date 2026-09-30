const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    amount: { type: Number, required: true, min: 1 },
    durationMonths: { type: Number, required: true, min: 1, max: 36 },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    ],
    benefits: [{ type: String, trim: true, maxlength: 200 }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

subscriptionPlanSchema.index({ isActive: 1, amount: 1 });
module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

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
    level: { type: String, trim: true, maxlength: 100 },
    accent: {
      type: String,
      enum: ["blue", "teal", "gold", "navy"],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    amount: { type: Number, required: true, min: 1 },
    currency: {
      type: String,
      enum: ["NGN"],
      default: "NGN",
      uppercase: true,
      trim: true,
    },
    billingInterval: {
      type: String,
      enum: ["one_time", "monthly", "quarterly", "annually"],
      default: "one_time",
      required: true,
    },
    durationMonths: { type: Number, required: true, min: 1, max: 36 },
    courseAccessLimit: { type: Number, min: 1 },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    ],
    plannedCourseTitles: [{ type: String, trim: true, maxlength: 200 }],
    benefits: [{ type: String, trim: true, maxlength: 200 }],
    features: [{ type: String, trim: true, maxlength: 200 }],
    popular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

subscriptionPlanSchema.index({ isActive: 1, amount: 1 });
module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

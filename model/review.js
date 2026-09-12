const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    isApproved: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true });
module.exports = mongoose.model("Review", reviewSchema);

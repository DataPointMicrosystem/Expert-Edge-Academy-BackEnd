const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
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
    type: { type: String, enum: ["free", "paid"], required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    completedLessons: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    lastLesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    lastAccessedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
module.exports = mongoose.model("Enrollment", enrollmentSchema);

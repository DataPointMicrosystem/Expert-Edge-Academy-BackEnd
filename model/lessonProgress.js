const mongoose = require("mongoose");

const lessonProgressSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    watchedDuration: { type: Number, min: 0, default: 0 },
    completedAt: Date,
  },
  { timestamps: true },
);

lessonProgressSchema.index({ enrollment: 1, lesson: 1 }, { unique: true });
module.exports = mongoose.model("LessonProgress", lessonProgressSchema);

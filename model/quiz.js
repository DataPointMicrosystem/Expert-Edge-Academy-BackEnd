const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["multiple_choice", "true_false", "short_answer"],
    default: "multiple_choice",
  },
  options: [{ text: String }],
  correctAnswer: { type: String, required: true, select: false },
  points: { type: Number, min: 1, default: 1 },
  order: { type: Number, default: 0 },
});

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    title: { type: String, required: true, trim: true },
    description: String,
    passingScore: { type: Number, min: 0, max: 100, default: 70 },
    maxAttempts: { type: Number, min: 1 },
    questions: [questionSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quiz", quizSchema);

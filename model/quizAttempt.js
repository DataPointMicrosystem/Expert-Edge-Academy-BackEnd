const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
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
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        answer: String,
        correct: Boolean,
        points: Number,
      },
    ],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    submittedAt: Date,
  },
  { timestamps: true },
);

quizAttemptSchema.index({ quiz: 1, student: 1, createdAt: -1 });
module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);

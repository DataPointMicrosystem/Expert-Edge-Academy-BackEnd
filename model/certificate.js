const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },
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
    studentName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    completionDate: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Certificate", certificateSchema);

const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["video", "document", "quiz", "assignment"],
      default: "video",
    },
    order: { type: Number, required: true, min: 0 },
    video: { url: String, publicId: String, duration: Number },
    document: { url: String, publicId: String },
    resources: [
      { title: String, url: String, publicId: String, fileType: String },
    ],
    isPreviewable: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

lessonSchema.index({ section: 1, order: 1 }, { unique: true });
module.exports = mongoose.model("Lesson", lessonSchema);

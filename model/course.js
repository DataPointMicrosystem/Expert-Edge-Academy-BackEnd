const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: { type: String, required: true, trim: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      required: true,
    },
    language: { type: String, default: "English", trim: true },
    price: { type: Number, min: 0, default: 0 },
    originalPrice: { type: Number, min: 0 },
    thumbnail: { url: String, publicId: String },
    previewVideo: { url: String, publicId: String },
    learningOutcomes: [{ type: String, trim: true }],
    requirements: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "approved",
        "published",
        "rejected",
        "archived",
      ],
      default: "draft",
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    publishedAt: Date,
  },
  { timestamps: true },
);

courseSchema.index({
  title: "text",
  shortDescription: "text",
  description: "text",
});
courseSchema.index({ status: 1, category: 1, level: 1, rating: -1 });
module.exports = mongoose.model("Course", courseSchema);

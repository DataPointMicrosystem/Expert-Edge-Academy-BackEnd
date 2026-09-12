const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

sectionSchema.index({ course: 1, order: 1 }, { unique: true });
module.exports = mongoose.model("Section", sectionSchema);

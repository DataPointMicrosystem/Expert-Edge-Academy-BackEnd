const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, order: 1 });
module.exports = mongoose.model("Category", categorySchema);

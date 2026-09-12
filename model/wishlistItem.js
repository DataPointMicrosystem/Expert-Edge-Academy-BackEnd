const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    user: {
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
  },
  { timestamps: true },
);

wishlistItemSchema.index({ user: 1, course: 1 }, { unique: true });
module.exports = mongoose.model("WishlistItem", wishlistItemSchema);

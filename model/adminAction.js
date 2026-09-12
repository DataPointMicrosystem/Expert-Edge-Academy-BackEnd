const mongoose = require("mongoose");

const adminActionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

adminActionSchema.index({ createdAt: -1 });
module.exports = mongoose.model("AdminAction", adminActionSchema);

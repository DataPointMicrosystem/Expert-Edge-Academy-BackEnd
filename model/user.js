const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    avatar: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    googleId: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      trim: true,
    },
    otpExpires: {
      type: Date,
    },
    verificationOtp: {
      type: String,
      trim: true,
      select: false,
    },
    verificationOtpExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.verificationOtp;
        delete ret.verificationOtpExpires;
        return ret;
      },
    },
  },
);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;

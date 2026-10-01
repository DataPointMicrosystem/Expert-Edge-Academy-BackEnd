const userModel = require("../model/user");
require("dotenv").config();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { brevo } = require("../utils/brevo");
const {
  resetPasswordTemplate,
  resetPasswordSuccessfulTemplate,
  emailVerificationTemplate,
} = require("../utils/email");

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "1h" },
  );

const publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  avatar: user.avatar,
});

exports.signUp = async (req, res) => {
  try {
    const { fullName, email, password, role = "student" } = req.body;
    const normalizedRole = role === "teacher" ? "instructor" : role;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
        error: { code: "VALIDATION_ERROR" },
      });
    }

    if (!["student", "instructor"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account role",
        error: { code: "INVALID_ROLE" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
        error: { code: "EMAIL_ALREADY_EXISTS" },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationOtp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const user = new userModel({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      verificationOtp,
      verificationOtpExpires: Date.now() + 10 * 60 * 1000,
    });
    await user.save();

    await brevo(
      user.email,
      user.fullName,
      emailVerificationTemplate({ name: user.fullName, otp: verificationOtp }),
    );

    return res.status(201).json({
      success: true,
      message: "Account created. Please verify your email.",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while signing up",
      error: { code: "SIGNUP_FAILED" },
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userModel
      .findOne({ email: email?.trim().toLowerCase() })
      .select("+verificationOtp +verificationOtpExpires");

    if (
      !user ||
      user.isVerified ||
      user.verificationOtp !== otp ||
      !user.verificationOtpExpires ||
      user.verificationOtpExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
        error: { code: "EMAIL_VERIFICATION_INVALID" },
      });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Email verification failed",
      error: { code: "EMAIL_VERIFICATION_FAILED" },
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message:
          "If the account exists and needs verification, a code was sent",
      });
    }

    const verificationOtp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    user.verificationOtp = verificationOtp;
    user.verificationOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await brevo(
      user.email,
      user.fullName,
      emailVerificationTemplate({ name: user.fullName, otp: verificationOtp }),
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to resend verification code",
      error: { code: "VERIFICATION_RESEND_FAILED" },
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel
      .findOne({ email: email?.toLowerCase() })
      .select("+password");
    if (!user || !user.isActive || user.isSuspended) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "User is not verified. Please verify your email before logging in.",
      });
    }
    user.lastLogin = new Date();
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token: createToken(user), user: publicUser(user) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while logging in",
      error: { code: "LOGIN_FAILED" },
    });
  }
};

exports.adminSignUp = async (req, res) => {
  const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const suppliedSecret = req.get("x-admin-bootstrap-secret") || "";
  if (!bootstrapSecret)
    return res.status(503).json({
      success: false,
      message: "Admin bootstrap is not configured",
      error: { code: "ADMIN_BOOTSTRAP_UNAVAILABLE" },
    });

  const expected = Buffer.from(bootstrapSecret);
  const supplied = Buffer.from(suppliedSecret);
  if (
    expected.length !== supplied.length ||
    !crypto.timingSafeEqual(expected, supplied)
  )
    return res.status(403).json({
      success: false,
      message: "Invalid admin bootstrap credentials",
      error: { code: "ADMIN_BOOTSTRAP_INVALID" },
    });

  const { fullName, email, password } = req.body;
  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof email !== "string" ||
    !/^\S+@\S+\.\S+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 12
  )
    return res.status(400).json({
      success: false,
      message:
        "Full name, valid email, and password of at least 12 characters are required",
      error: { code: "VALIDATION_ERROR" },
    });

  if (await userModel.exists({ role: "admin" }))
    return res.status(409).json({
      success: false,
      message: "Admin bootstrap is already complete",
      error: { code: "ADMIN_ALREADY_CONFIGURED" },
    });

  const normalizedEmail = email.trim().toLowerCase();
  if (await userModel.exists({ email: normalizedEmail }))
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
      error: { code: "EMAIL_ALREADY_EXISTS" },
    });

  const user = await userModel.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    role: "admin",
    isVerified: true,
  });
  return res.status(201).json({
    success: true,
    message: "Initial admin account created. Sign in to continue.",
    data: { user: publicUser(user) },
  });
};

exports.adminLogin = async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = req.body.password;
  if (!email || typeof password !== "string")
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
      error: { code: "VALIDATION_ERROR" },
    });

  const user = await userModel
    .findOne({ email, role: "admin" })
    .select("+password");
  if (
    !user ||
    !user.isActive ||
    user.isSuspended ||
    !user.isVerified ||
    !(await bcrypt.compare(password, user.password))
  )
    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials or unavailable account",
      error: { code: "ADMIN_LOGIN_INVALID" },
    });

  user.lastLogin = new Date();
  await user.save();
  res.setHeader("Authorization", `Bearer ${createToken(user)}`);
  return res.status(200).json({
    success: true,
    message: "Admin login successful",
    data: { user: publicUser(user) },
  });
};

exports.loginwithGoogle = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: { token: createToken(req.user), user: publicUser(req.user) },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while logging in with Google",
      error: { code: "GOOGLE_LOGIN_FAILED" },
    });
  }
};
exports.signUpWithGoogle = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication failed",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: { token: createToken(req.user), user: publicUser(req.user) },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error occurred during Google authentication",
    });
  }
};
exports.forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const OTP = Math.round(Math.random() * 1e6)
      .toString()
      .padStart(6, "0");
    user.otp = OTP;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    const data = {
      name: user.fullName,
      otp: OTP,
    };
    await brevo(user.email, user.fullName, resetPasswordTemplate(data));
    await user.save();

    res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error occurred while sending OTP",
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        message: "Invalid Credentials",
      });
    }
    if (Date.now() > user.otpExpires || otp !== user.otp) {
      return res.status(400).json({
        message: "OTP is invalid",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    await brevo(
      user.email,
      user.fullName,
      resetPasswordSuccessfulTemplate(user.fullName),
    );

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error: Password reset failed",
    });
  }
};

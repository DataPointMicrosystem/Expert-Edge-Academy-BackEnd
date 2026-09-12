const router = require("express").Router();

const {
  signUp,
  login,
  loginwithGoogle,
  signUpWithGoogle,
  forgotpassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require("../controller/userController");
const { profile, loginProfile } = require("../middleware/passport");

router.post("/sign-up", signUp);
router.post("/signup", signUp);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password", resetPassword);

router.get("/auth/google", profile);
router.get("/auth/google/callback", loginProfile, loginwithGoogle);
router.get("/auth/google/signup", profile);
router.get("/auth/google/signup/callback", loginProfile, signUpWithGoogle);

module.exports = router;

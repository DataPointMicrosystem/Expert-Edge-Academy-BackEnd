const router = require("express").Router();
const controller = require("../controller/referralController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, optionalAuthentication } = require("../middleware/auth");

router.post("/track", optionalAuthentication, asyncHandler(controller.track));
router.use(Authentication);
router.get("/me", asyncHandler(controller.summary));
router.get("/code", asyncHandler(controller.code));
router.get("/history", asyncHandler(controller.history));
router.post("/withdraw", asyncHandler(controller.withdraw));

module.exports = router;

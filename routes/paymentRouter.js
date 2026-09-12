const router = require("express").Router();
const controller = require("../controller/paymentController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.post("/webhook", expressRaw(), asyncHandler(controller.webhook));
router.use(Authentication, requireRoles("student"));
router.post("/initialize", asyncHandler(controller.initialize));
router.post("/verify/:reference", asyncHandler(controller.verify));
router.get("/history", asyncHandler(controller.history));
function expressRaw() {
  return require("express").raw({ type: "application/json" });
}
module.exports = router;

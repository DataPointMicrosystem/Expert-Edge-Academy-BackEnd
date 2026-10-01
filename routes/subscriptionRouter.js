const router = require("express").Router();
const controller = require("../controller/subscriptionController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");

router.post(
  "/webhook",
  require("express").raw({ type: "application/json" }),
  asyncHandler(controller.webhook),
);
router.get("/plans", asyncHandler(controller.plans));
router.get("/plans/:planId", asyncHandler(controller.planDetails));
router.use(Authentication, requireRoles("student"));
router.get("/me", asyncHandler(controller.current));
router.get("/history", asyncHandler(controller.history));
router.post("/initialize", asyncHandler(controller.initialize));
router.post("/verify/:reference", asyncHandler(controller.verify));

module.exports = router;

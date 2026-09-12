const router = require("express").Router();
const controller = require("../controller/accountController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.use(Authentication);
router.get("/me", asyncHandler(controller.me));
router.put("/profile", asyncHandler(controller.update));
router.put("/change-password", asyncHandler(controller.changePassword));
router.get(
  "/dashboard/student",
  requireRoles("student"),
  asyncHandler(controller.studentDashboard),
);
router.get(
  "/dashboard/instructor",
  requireRoles("instructor"),
  asyncHandler(controller.instructorDashboard),
);
router.get("/:userId", asyncHandler(controller.publicProfile));
module.exports = router;

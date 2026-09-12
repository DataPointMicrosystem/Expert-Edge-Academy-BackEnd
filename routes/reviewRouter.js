const router = require("express").Router();
const controller = require("../controller/reviewController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.get("/courses/:courseId", asyncHandler(controller.list));
router.post(
  "/courses/:courseId",
  Authentication,
  requireRoles("student"),
  asyncHandler(controller.create),
);
router.put(
  "/:reviewId",
  Authentication,
  requireRoles("student"),
  asyncHandler(controller.update),
);
router.delete(
  "/:reviewId",
  Authentication,
  requireRoles("student", "admin"),
  asyncHandler(controller.remove),
);
module.exports = router;

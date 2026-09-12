const router = require("express").Router();
const controller = require("../controller/quizController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.get("/:quizId", Authentication, asyncHandler(controller.get));
router.post(
  "/courses/:courseId",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.create),
);
router.post(
  "/:quizId/attempts",
  Authentication,
  requireRoles("student"),
  asyncHandler(controller.start),
);
router.post(
  "/attempts/:attemptId/submit",
  Authentication,
  requireRoles("student"),
  asyncHandler(controller.submit),
);
module.exports = router;

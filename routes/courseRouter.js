const router = require("express").Router();
const controller = require("../controller/courseController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");

router.get("/", asyncHandler(controller.list));
router.get(
  "/featured",
  asyncHandler((req, res) => {
    req.query.featured = "true";
    return controller.list(req, res);
  }),
);
router.get(
  "/trending",
  asyncHandler((req, res) => {
    req.query.trending = "true";
    return controller.list(req, res);
  }),
);
router.get(
  "/instructor/me",
  Authentication,
  requireRoles("instructor"),
  asyncHandler(controller.instructorCourses),
);
router.get("/:slug", asyncHandler(controller.getBySlug));
router.post(
  "/",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.create),
);
router.put(
  "/:courseId",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.update),
);
router.delete(
  "/:courseId",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.remove),
);
router.post(
  "/:courseId/submit",
  Authentication,
  requireRoles("instructor"),
  asyncHandler(controller.submitForReview),
);
router.post(
  "/:courseId/sections",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.createSection),
);
router.post(
  "/:courseId/sections/:sectionId/lessons",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.createLesson),
);
module.exports = router;

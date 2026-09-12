const router = require("express").Router();
const controller = require("../controller/adminController");
const courseController = require("../controller/courseController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.use(Authentication, requireRoles("admin"));
router.get("/analytics", asyncHandler(controller.analytics));
router.get("/users", asyncHandler(controller.users));
router.patch("/users/:userId/status", asyncHandler(controller.setStatus));
router.get("/courses", asyncHandler(controller.reviewCourses));
router.post("/courses/:courseId/review", asyncHandler(controller.review));
router.patch(
  "/courses/:courseId/publication",
  asyncHandler(courseController.adminPublish),
);
router.get("/payments", asyncHandler(controller.payments));
router.get("/reviews", asyncHandler(controller.reviews));
router.get("/certificates", asyncHandler(controller.certificates));
router.get("/categories", asyncHandler(controller.categories));
router.post("/notifications", asyncHandler(controller.notify));
module.exports = router;

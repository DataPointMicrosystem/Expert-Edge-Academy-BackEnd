const router = require("express").Router();
const controller = require("../controller/wishlistController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.use(Authentication, requireRoles("student"));
router.get("/", asyncHandler(controller.list));
router.post("/add/:courseId", asyncHandler(controller.add));
router.delete("/remove/:courseId", asyncHandler(controller.remove));
module.exports = router;

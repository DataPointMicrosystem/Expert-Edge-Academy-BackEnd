const router = require("express").Router();
const controller = require("../controller/categoryController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");

router.get("/", asyncHandler(controller.list));
router.post(
  "/",
  Authentication,
  requireRoles("admin"),
  asyncHandler(controller.create),
);
router.put(
  "/:categoryId",
  Authentication,
  requireRoles("admin"),
  asyncHandler(controller.update),
);
router.delete(
  "/:categoryId",
  Authentication,
  requireRoles("admin"),
  asyncHandler(controller.remove),
);
module.exports = router;

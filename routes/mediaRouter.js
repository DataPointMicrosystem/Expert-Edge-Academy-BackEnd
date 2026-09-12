const router = require("express").Router();
const controller = require("../controller/mediaController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication, requireRoles } = require("../middleware/auth");
router.post(
  "/upload",
  Authentication,
  requireRoles("instructor", "admin"),
  asyncHandler(controller.upload),
);
module.exports = router;

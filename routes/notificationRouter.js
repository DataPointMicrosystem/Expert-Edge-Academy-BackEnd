const router = require("express").Router();
const controller = require("../controller/notificationController");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication } = require("../middleware/auth");
router.use(Authentication);
router.get("/", asyncHandler(controller.list));
router.put("/read-all", asyncHandler(controller.readAll));
router.put("/:notificationId", asyncHandler(controller.read));
module.exports = router;

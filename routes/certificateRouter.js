const router = require("express").Router();
const Certificate = require("../model/certificate");
const asyncHandler = require("../utils/asyncHandler");
const { Authentication } = require("../middleware/auth");
const { success, failure } = require("../utils/apiResponse");
router.get(
  "/verify/:verificationCode",
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      verificationCode: req.params.verificationCode,
    })
      .populate("student", "fullName")
      .populate("course", "title");
    if (!certificate)
      return failure(
        res,
        404,
        "Certificate not found",
        "CERTIFICATE_NOT_FOUND",
      );
    return success(res, 200, "Certificate verified", certificate);
  }),
);
router.use(Authentication);
router.get(
  "/",
  asyncHandler(async (req, res) =>
    success(
      res,
      200,
      "Certificates retrieved",
      await Certificate.find({ student: req.user._id })
        .populate("course", "title thumbnail")
        .sort({ completionDate: -1 }),
    ),
  ),
);
router.get(
  "/:certificateId",
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({
      _id: req.params.certificateId,
      student: req.user._id,
    });
    if (!certificate)
      return failure(
        res,
        404,
        "Certificate not found",
        "CERTIFICATE_NOT_FOUND",
      );
    return success(res, 200, "Certificate retrieved", certificate);
  }),
);
module.exports = router;

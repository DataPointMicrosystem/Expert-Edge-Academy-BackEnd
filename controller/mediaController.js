const cloudinaryService = require("../services/cloudinaryService");
const { success, failure } = require("../utils/apiResponse");

exports.upload = async (req, res) => {
  if (!req.files?.file)
    return failure(res, 400, "A file is required", "FILE_REQUIRED");
  const file = req.files.file;
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 200 * 1024 * 1024);
  if (file.size > maxBytes)
    return failure(res, 413, "File is too large", "FILE_TOO_LARGE");
  const result = await cloudinaryService.uploadBuffer(file.data, {
    resource_type: req.body.resourceType || "auto",
  });
  return success(res, 201, "File uploaded", result);
};

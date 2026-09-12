const cloudinary = require("cloudinary").v2;

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);
if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

exports.uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!configured)
      return reject(
        Object.assign(new Error("Cloudinary is not configured"), {
          statusCode: 503,
          code: "MEDIA_PROVIDER_UNAVAILABLE",
        }),
      );
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "expertedge", ...options },
      (error, result) =>
        error
          ? reject(error)
          : resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type,
              bytes: result.bytes,
            }),
    );
    stream.end(buffer);
  });

exports.delete = async (publicId, resourceType = "image") => {
  if (!configured) return false;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  return true;
};

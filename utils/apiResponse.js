exports.success = (res, statusCode, message, data = {}, meta) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

exports.failure = (res, statusCode, message, code, details) =>
  res
    .status(statusCode)
    .json({
      success: false,
      message,
      error: { code, ...(details ? { details } : {}) },
    });

const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is temporarily unavailable",
      error: { code: "DATABASE_UNAVAILABLE" },
    });
  }
  return next();
};

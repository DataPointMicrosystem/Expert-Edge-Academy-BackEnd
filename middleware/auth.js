const jwt = require("jsonwebtoken");
const User = require("../model/user");

exports.Authentication = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: { code: "AUTH_TOKEN_MISSING" },
    });
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(claims.userId).select("-password");
    if (!user || !user.isActive || user.isSuspended) {
      return res.status(401).json({
        success: false,
        message: "Account is unavailable",
        error: { code: "ACCOUNT_UNAVAILABLE" },
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: { code: "AUTH_TOKEN_INVALID" },
    });
  }
};

exports.requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
        error: { code: "AUTH_FORBIDDEN" },
      });
    }

    return next();
  };

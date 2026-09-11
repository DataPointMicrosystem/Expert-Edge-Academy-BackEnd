const jwt = require("jsonwebtoken");

exports.Authentication = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not Found",
      });
    }
    const Validtoken = jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, data) => {
        if (err) {
          console.log(err.message);
          return res.status(500).json({
            message: "Token validation failed",
            data: Validtoken,
          });
        }
        req.user = data;
        next();
      },
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

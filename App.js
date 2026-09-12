const expressSession = require("express-session");
const { passport } = require("./middleware/passport");
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRouter = require("./routes/authRouter");
const courseRouter = require("./routes/courseRouter");
const categoryRouter = require("./routes/categoryRouter");
const enrollmentRouter = require("./routes/enrollmentRouter");
const cartRouter = require("./routes/cartRouter");
const wishlistRouter = require("./routes/wishlistRouter");
const paymentRouter = require("./routes/paymentRouter");
const reviewRouter = require("./routes/reviewRouter");
const certificateRouter = require("./routes/certificateRouter");
const accountRouter = require("./routes/accountRouter");
const quizRouter = require("./routes/quizRouter");
const notificationRouter = require("./routes/notificationRouter");
const adminRouter = require("./routes/adminRouter");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/openapi");
const databaseGuard = require("./middleware/database");
const mediaRouter = require("./routes/mediaRouter");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(
  fileUpload({
    limits: {
      fileSize: Number(process.env.MAX_UPLOAD_BYTES || 200 * 1024 * 1024),
    },
    abortOnLimit: true,
    createParentPath: false,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.use(
  expressSession({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});
app.get("/api/openapi.json", (req, res) => res.json(swaggerSpec));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", databaseGuard, authRouter);
app.use("/api/courses", databaseGuard, courseRouter);
app.use("/api/categories", databaseGuard, categoryRouter);
app.use("/api/enrollments", databaseGuard, enrollmentRouter);
app.use("/api/cart", databaseGuard, cartRouter);
app.use("/api/wishlist", databaseGuard, wishlistRouter);
app.use("/api/payments", databaseGuard, paymentRouter);
app.use("/api/reviews", databaseGuard, reviewRouter);
app.use("/api/certificates", databaseGuard, certificateRouter);
app.use("/api/users", databaseGuard, accountRouter);
app.use("/api/quizzes", databaseGuard, quizRouter);
app.use("/api/notifications", databaseGuard, notificationRouter);
app.use("/api/admin", databaseGuard, adminRouter);
app.use("/api/media", databaseGuard, mediaRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: { code: "ROUTE_NOT_FOUND" },
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Internal server error",
    error: { code: error.code || "INTERNAL_SERVER_ERROR" },
  });
});

module.exports = app;

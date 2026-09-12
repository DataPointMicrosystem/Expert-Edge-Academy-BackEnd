const mongoose = require("mongoose");
require("dotenv").config();
const app = require("./App");

const PORT = process.env.PORT || 1023;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log("Database connected successfully"))
  .catch((error) =>
    console.error("Unable to connect to MongoDB:", error.message),
  );

process.on("SIGTERM", () =>
  server.close(() => mongoose.connection.close(false)),
);

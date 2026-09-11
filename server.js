const mongoose = require("mongoose");
require("dotenv").config();

const PORT = process.env.PORT || 1023;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to MongoDB:", error.message);
  });

const app = require("./App");

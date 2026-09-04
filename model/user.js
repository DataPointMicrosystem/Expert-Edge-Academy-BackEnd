const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName:{
            type: String,
            required: true,
            trim: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password:{
            type: String,
            required: true,
            trim: true
        },
        role:{
            type: String,
            enum: ["student", "teacher"],
            default: "student"
        }
    },{timestamps: true}
);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;

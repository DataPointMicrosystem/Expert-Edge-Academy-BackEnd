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
        googleId:{
            type: String,
            trim: true
        },
        isVerified:{
            type: Boolean,
            default: false
        },
        otp:{
            type: String,
            trim: true
        },
        otpExpires:{
            type:Date,
            default:()=>{
                return Date.now() + ( 1000 * 60 * 7 )
      }
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

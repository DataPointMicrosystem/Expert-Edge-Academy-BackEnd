const userModel = require ('../model/user')
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const otpGenerator = require('otp-generator')
const {brevo} = require('../utils/brevo')
const {resetPasswordTemplate, resetPasswordSuccessfulTemplate} = require('../email')

exports.signUp = async(req, res) =>{
    try{
        const{fullName, email, password} = req.body

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = new userModel({
            fullName,
            email,
            password: hashedPassword
        })
        await user.save()
        res.status(201).json({
            message: "User created successfully",
            user: {
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        })
    }catch(error){
        res.status(500).json({
            message: "Error occurred while signing up"
        })
    }
}
exports.login = async (req, res)=>{
    try{
        const {email, password} = req.body
        const user = await userModel.findOne({email: email.toLowerCase()})
        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }
        const comparePassword = await bcrypt.compare(password, user.password)
        if(!comparePassword){
            return res.status(401).json({
                message: "Invalid password"
            })
        }
        if(!user.isVerified){
            return res.status(403).json({
                message: "User is not verified. Please verify your email before logging in."
            })
        }
        const token = jwt.sign({userId: user._id},
             process.env.JWT_SECRET, 
             {expiresIn: "1h"}
        )
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        })
    }catch(error){
        res.status(500).json({
            message: "Error occurred while logging in"
        })
    }
}
exports.loginwithGoogle = async (req, res) =>{
    try{
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication failed"
            });
        }

        const token = jwt.sign({userId: req.user._id},
            process.env.JWT_SECRET,
            {expiresIn: "1h"});

        res.status(200).json({
            message: "Google authentication successful",
            token,
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                isVerified: req.user.isVerified
            }
        });
    }catch(error){
        console.log(error);
        res.status(500).json({
            message: "Error occurred while logging in with Google"
        });
    }
}
exports.signUpWithGoogle = async (req, res) =>{
    try{
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication failed"
            });
        }
        const token = jwt.sign({userId: req.user._id},
            process.env.JWT_SECRET,
            {expiresIn: "1h"});

        res.status(isNewUser ? 201 : 200).json({
            message: isNewUser ? "Sign up with Google successful" : "Login with Google successful",
            token,
            user: {
                id: req.user._id,
                fullName: req.user.fullName,
                email: req.user.email,
                role: req.user.role,
                isVerified: req.user.isVerified
            }
        });
    }catch(error){
        console.log(error);
        res.status(500).json({
            message: "Error occurred during Google authentication"
        });
    }
}
exports.forgotpassword = async (req, res) =>{
    try{
        const {email} = req.body
        const user = await userModel.findOne({email: email.toLowerCase()})
        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }
        
        const OTP = Math.round(Math.random() * 1e6).toString().padStart(6, "0")
        user.otp = OTP
        user.otpExpires = Date.now() + 10 * 60 * 1000
        const data = {
                name: user.fullName,
                otp: OTP
            }
            await brevo(user.email, user.fullName, resetPasswordTemplate(data))
            await user.save()
        
        res.status(200).json({
            message: "OTP sent to your email"
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            message: "Error occurred while sending OTP"
        })
    }
}
exports.resetPassword = async (req, res) =>{
    try{
        const {email, otp, newPassword} = req.body
        const user = await userModel.findOne({email: email.toLowerCase()})

        if(!user){
            return res.status(404).json({
                message: "Invalid Credentials"
            })
        }
        if ( Date.now()> user.otpExpires || otp !== user.otp){
            return res.status(400).json({
                message: "OTP is invalid"
            })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        user.password = hashedPassword
        await user.save()

        await brevo(user.email, user.fullName, resetPasswordSuccessfulTemplate(user.fullName))

        res.status(200).json({
            message: "Password reset successfully"
        })
    }catch(error){
        res.status(500).json({
            message:'Error: Password reset failed'
        })
    }
}

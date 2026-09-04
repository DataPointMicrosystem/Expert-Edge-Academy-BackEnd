const userModel = require ('../model/user')
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

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



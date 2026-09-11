require('dotenv').config()

const express = require('express')
const PORT = process.env.PORT|| 1023

const expressSession = require('express-session')
const {passport} = require('./middleware/passport')

const app = express()
app.use(express.json())

app.use(expressSession({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const userRouter = require('./routes/userRouter')
app.use(userRouter)

const mongoose = require("mongoose");


mongoose.connect(process.env.MONGODB_URI).then(()=>{
    console.log("Database connected successfully")

    app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)})

}).catch((error)=>{
    console.error("Unable to connect to MongoDB:", error.message)
})

require('dotenv').config()

const express = require('express')
const PORT = process.env.PORT|| 1023

const app = express()
app.use(express.json())

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

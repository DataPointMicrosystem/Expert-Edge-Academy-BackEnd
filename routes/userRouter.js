const router = require('express').Router()

const { signUp, login } = require('../controller/userController')

router.post('/sign-up', signUp)
router.post('/login', login)

module.exports = router

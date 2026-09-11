const router = require('express').Router()

const { signUp, login, loginwithGoogle, signUpWithGoogle, forgotpassword, resetPassword} = require('../controller/userController')
const { profile, loginProfile } = require('../middleware/passport')

router.post('/sign-up', signUp)
router.post('/login', login)
router.post('/forgot-password', forgotpassword)
router.post('/reset-password',resetPassword)


router.get('/auth/google', profile)
router.get('/auth/google/callback', loginProfile, loginwithGoogle)
router.get('/auth/google/signup', profile)
router.get('/auth/google/signup/callback', loginProfile, signUpWithGoogle)

module.exports = router

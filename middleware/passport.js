const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../model/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      let user = await userModel.findOne({ email: profile._json.email });

      if (!user) {
        const generatedPassword = crypto.randomBytes(32).toString('hex');
        user = new userModel({
          fullName: profile.displayName || profile._json.name,
          email: profile._json.email,
          googleId: profile.id,
          isVerified: true,
          
          password: await bcrypt.hash(generatedPassword, 10)
        });
        await user.save();
      }

      return cb(null, user);
    } catch (error) {
      console.log(error);
      return cb(error, null); // fixed order
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    if (!user) {
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const profile = passport.authenticate('google', { scope: ['profile', 'email'] });
const loginProfile = passport.authenticate('google', { failureRedirect: '/login' });

module.exports = { passport, profile, loginProfile };

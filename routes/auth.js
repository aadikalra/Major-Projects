var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var db = require('../db');
const { saveredirectUrl } = require("../middleware.js");

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function verify(issuer, profile, cb) {
  db.get('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [
    issuer,
    profile.id
  ], function(err, row) {
    if (err) { return cb(err); }
    if (!row) {
      db.run('INSERT INTO users (name, profile_picture) VALUES (?, ?)', [
        profile.displayName,
        profile.photos[0].value // Assuming profile picture is here
      ], function(err) {
        if (err) { return cb(err); }

        var id = this.lastID;
        db.run('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [
          id,
          issuer,
          profile.id
        ], function(err) {
          if (err) { return cb(err); }
          var user = {
            id: id,
            name: profile.displayName,
            profile_picture: profile.photos[0].value // Include profile picture
          };
          return cb(null, user);
        });
      });
    } else {
      db.get('SELECT * FROM users WHERE id = ?', [ row.user_id ], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false); }
        return cb(null, row);
      });
    }
  });
}));




passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});


passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('google_signup/google_login.ejs');
});

router.get('/login/federated/google', passport.authenticate('google'));
router.get('/oauth2/redirect/google', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;
    if (res.locals.redirectUrl) {
      res.redirect(res.locals.redirectUrl);
    } else {
      req.flash('success', `Welcome back`);
      console.log(`Logged in with Google`);
      res.redirect('/listings'); // replace with your default route
    }
  }
);


router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/listings');
    req.flash("success", "You have been logged out");
  });
});

router.get('/logout', function(req, res, next) {
  res.render("listings/logout.ejs");
});

module.exports = router;
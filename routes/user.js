const express = require('express')
const router = express.Router({ mergeParams: true })
const User = require('../models/user.js')
const wrapAsync = require('../utils/wrapAsync.js')
const passport = require('passport')
const { saveredirectUrl } = require('../middleware.js')
const userController = require('../controllers/users.js')

// Login routes
router
  .route('/login')
  .get(userController.renderLoginForm)
  .post(
    saveredirectUrl,
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true
    }),
    wrapAsync(userController.login)
  )

// Logout route
router.get('/logout', userController.logout)

// Register routes
router
  .route('/register')
  .get(userController.renderSignUpForm)
  .post(userController.signup)

module.exports = router

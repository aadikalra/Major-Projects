const wrapAsync = require('../utils/wrapAsync')
const User = require('../models/user')

module.exports.renderSignUpForm = (req, res) => {
  res.render('users/signup.ejs')
}

module.exports.renderLoginForm = (req, res) => {
  res.render('users/login.ejs')
}

module.exports.login = async (req, res) => {
  // Access the user object from the request
  const user = req.user

  let welcomeMessage;
  if (user) {
    // Construct the welcome message with user's first name (if available)
    welcomeMessage = `Welcome back ${user.username}!`
  } else {
    welcomeMessage = 'Welcome!'
  }

  // Set the flash message with the constructed welcome message
  req.flash('success', welcomeMessage)

  // Redirect to listings page
  if (res.locals.redirectUrl) {
    res.redirect(res.locals.redirectUrl)
  } else {
    res.redirect('/listings')
  }
}

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body
    const newUser = new User({ email, username })
    const registeredUser = await User.register(newUser, password)
    console.log(registeredUser)
    req.login(registeredUser, err => {
      if (err) {
        return next(err)
      }
      req.flash('success', 'Welcome to Airbnb')
      res.redirect('/listings')
    })
  } catch (error) {
    req.flash('error', error.message)
    res.redirect('/signup')
  }
}

module.exports.logout = async (req, res, next) => {
  req.logout(err => {
    if (err) {
      next(err)
    }
    req.flash('success', 'Logged out successfully, come back soon!!!')
    res.redirect('/listings')
  })
}

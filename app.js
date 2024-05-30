// =======================
// Required Modules
// =======================
if (process.env.NODE_ENV != 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const flash = require('connect-flash')
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const ExpressError = require('./utils/ExpressError.js')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const localStrategy = require('passport-local')
const User = require('./models/user.js')
const db = require('./db.js')
const createError = require('http-errors')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const { isLoggedIn } = require('./middleware.js')

// =======================
// Routers
// =======================
const listingRouter = require('./routes/listing.js')
const reviewRouter = require('./routes/review.js')
const userRouter = require('./routes/user.js')
const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth')
const { configDotenv } = require('dotenv')

// =======================
// Database Connection
// =======================

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/wanderlust'

// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

async function main () {
  await mongoose.connect(dbUrl)
}

main()
  .then(() => {
    console.log('\x1b[34mConnected to DB\x1b[0m')
  })
  .catch(err => {
    console.log(err)
  })

// =======================
// App Configuration
// =======================
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.engine('ejs', ejsMate)
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))

// =======================
// Session Configuration
// =======================
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.secret },
  touchafter: 24 * 60 * 60,
})

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e)
})

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}

app.use(flash())
app.use(session(sessionOptions))

// =======================
// Passport Configuration
// =======================
app.use(passport.initialize())
app.use(passport.session())

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, {
      id: user.id,
      username: user.username,
      name: user.name
    })
  })
})

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user)
  })
})

// =======================
// Middleware
// =======================
app.use((req, res, next) => {
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  res.locals.user = req.user // Make sure user is available in all templates
  next()
})

app.use(logger('dev'))
app.use(express.json())
app.use(cookieParser())

// =======================
// Routes
// =======================
app.use('/listings/:id/reviews', reviewRouter)
app.use('/', userRouter)
app.use('/', indexRouter)
app.use('/listings', listingRouter)
app.use('/', authRouter)

app.get('/', (req, res) => {
  res.send('Hi, I am root')
})

// =======================
// Error Handling
// =======================
app.all('*', (req, res, next) => {
  next(new ExpressError(404, 'Page Not Found'))
})

app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Something went wrong' } = err
  res.render('listings/error.ejs', { statusCode, message })
})

// =======================
// Server Initialization
// =======================
const server = app.listen(1234, () => {
  console.log(`The Server is Listening on Port: ${server.address().port}`)
})

// =======================
// Additional Configuration
// =======================
app.locals.pluralize = require('pluralize')

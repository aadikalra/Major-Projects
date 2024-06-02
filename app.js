// =======================
// Required Modules
// =======================
if (process.env.NODE_ENV !== 'production') {
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
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const { isLoggedIn } = require('./middleware.js')
const categoryData = require('./init/categoryData.js')

// =======================
// Routers
// =======================
const listingRouter = require('./routes/listing.js')
const reviewRouter = require('./routes/review.js')
const userRouter = require('./routes/user.js')
const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth')
const Listing = require('./models/listing.js')

// =======================
// Database Connection
// =======================
const dbUrl = process.env.ATLASDB_URL

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('\x1b[34mConnected to DB\x1b[0m')
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
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 60 * 60
})

store.on('error', function (e) {
  console.log('SESSION STORE ERROR', e)
})

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Ensure cookies are secure in production
  }
}

app.use(session(sessionOptions))
app.use(flash())

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
// Middleware to set res.locals
// =======================
app.use((req, res, next) => {
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  res.locals.user = req.user
  console.log('res.locals in middleware:', res.locals)
  next()
})

// =======================
// Additional Middleware
// =======================
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
  res.render('listings/index.ejs', { categoryData })
})

// API route for JSON data
app.get('/api/listings/:id', async (req, res) => {
  let { id } = req.params
  try {
    const listing = await Listing.findById(id)
      .populate({ path: 'reviews', populate: { path: 'author' } })
      .populate('owner')

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    } else {
      res.json({ listing, averageRating: { $avg: '$rating' } })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// =======================
// Error Handling
// =======================
app.all('*', (req, res, next) => {
  next(new ExpressError(404, 'Page Not Found'))
})

app.use((err, req, res, next) => {
  const { statusCode = 500, message = 'Something went wrong' } = err
  res.render('listings/error.ejs', { statusCode, message })
})

// =======================
// Server Initialization
// =======================
const port = process.env.PORT || 1234
app.listen(port, () => {
  console.log(`The Server is Listening on Port: ${port}`)
})

// =======================
// Additional Configuration
// =======================
app.locals.pluralize = require('pluralize')

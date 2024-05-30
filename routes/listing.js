// =======================
// Required Modules
// =======================
const express = require('express')
// Objects
const { storage } = require('../cloudConfig.js')
const { isLoggedIn, validateListing, isOwner } = require('../middleware.js')
const { listingSchema } = require('../schema.js')
// Utils
const wrapAsync = require('../utils/wrapAsync.js')
const ExpressError = require('../utils/ExpressError.js')
// Models
const Listing = require('../models/listing.js')
const Review = require('../models/review.js')
const User = require('../models/user.js')
// Data
const categoryData = require('../init/categoryData.js')
// Controllers
const listingController = require('../controllers/listings.js')
// Cloud
const multer = require('multer')
const upload = multer({ storage })

// =======================
// Router Setup
// =======================
const router = express.Router()

// =======================
// Routes
// =======================

// Index Route
router
  .route('/')
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  )

// Category Route
router.get('/categories/:category', wrapAsync(listingController.category))

// New Route
router.get('/new', isLoggedIn, listingController.renderNewForm)

// Edit Route
router.get('/:id/edit', isLoggedIn, wrapAsync(listingController.renderEditForm))

// Delete, Show, & Put Route
router
  .route('/:id')
  .get(listingController.showListing)
  .post(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.updateListings)
  )
  .delete(isLoggedIn, wrapAsync(listingController.destroyListing))

// =======================
// Export Router
// =======================
module.exports = router

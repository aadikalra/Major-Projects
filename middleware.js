const Listing = require('./models/listing.js')
const Review = require('./models/review.js')
const { listingSchema, reviewSchema } = require('./schema.js')
const ExpressError = require('./utils/ExpressError.js')

module.exports.isLoggedIn = (req, res, next) => {
  console.log('isLoggedIn middleware called')
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl
    req.flash('error', 'You must be logged in to create a listing')
    return res.redirect('/login')
  }
  next()
}

module.exports.saveredirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl
  }
  next()
}

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params
  let review = await Review.findById(reviewId)

  if (!review) {
    req.flash('error', 'Review not found')
    return res.redirect(`/listings/${id}`)
  }

  if (review.author.toString() !== req.user.id.toString()) {
    // Ensure toString() to compare correctly
    req.flash('error', 'You are not the author of this review')
    return res.redirect(`/listings/${id}`)
  }

  next()
}

module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body)
  if (error) {
    const msg = error.details.map(el => el.message).join(',')
    res.status(404);
    req.flash("error", msg);
    res.redirect("/listings");
  } else {
    next()
  }
}

module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body)
  if (error) {
    let errorMessage = error.details.map(el => el.message).join(',')
    throw new ExpressError(400, errorMessage)
  } else {
    next()
  }
}

// Middleware to check if the user is logged in and is the owner of the listing
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  if (!req.user) {
    req.flash('error', 'You need to be logged in to edit a listing');
    return res.redirect(`/listings/${id}`);
  }

  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash('error', 'Listing not found');
    return res.redirect('/listings');
  }

  if (listing.owner.toString() !== req.user.id.toString()) {
    console.log(listing);
    console.log(req.user);
    req.flash('error', "You don't have permission to edit this listing");
    return res.redirect(`/listings/${id}`);
  }

  req.listing = listing; // Attach the listing to the request object
  next();
};
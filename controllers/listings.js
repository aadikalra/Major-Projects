const Listing = require('../models/listing')
const Review = require('../models/review.js')
const categoryData = require('../init/categoryData.js')
const wrapAsync = require('../utils/wrapAsync.js')
const { listingSchema } = require('../schema.js')

module.exports.index = async (req, res) => {
  let sortOption = req.query.sort || 'asc'
  let sortQuery = sortOption === 'asc' ? { price: 1 } : { price: -1 }

  // const averageRating = await Review.aggregate([
  //   {
  //     $group: {
  //       _id: null,
  //       averageRating: { $avg: '$rating' }
  //     }
  //   }
  // ])

  const allListings = await Listing.find({}).sort(sortQuery)
  console.log(req.user);
  res.render('listings/index', {
    allListings,
    sortOption,
    categoryData,
    user: req.user // Pass user to the template
  });

  console.log(req.user)
}

module.exports.category = async (req, res) => {
  let { category } = req.params
  const CategoryURL = category
  console.log(CategoryURL)
  const allListings = await Listing.find({})
  res.render('listings/category.ejs', {
    CategoryURL,
    allListings,
    categoryData
  })
}

module.exports.renderNewForm = (req, res) => {
  res.render('listings/new', { categoryData })
}

module.exports.showListing = wrapAsync(async (req, res) => {
  let { id } = req.params
  try {
    const listing = await Listing.findById(id)
      .populate({ path: 'reviews', populate: { path: 'author' } })
      .populate('owner')

    const averageRating = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ])

    if (!listing) {
      req.flash(
        'error',
        'This listing does not exist anymore, like your self esteem.'
      )
      return res.redirect('/listings')
    } else {
      console.log(averageRating);
      res.render(
        'listings/show.ejs',
        { listing, averageRating: { $avg: '$rating' }, categoryData, user: req.user }
      )
    }
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

module.exports.createListing = async (req, res, next) => {
  console.clear()
  console.log('1. ENTERED INTO: POST -- CREATE LISTING')
  let url = req.file.path
  let filename = req.file.filename

  const newListing = new Listing(req.body.listing)
  console.log('2. NEW LISTING HAS BEEN MADE')
  newListing.owner = req.user.id
  newListing.image = {
    url,
    filename
  }
  console.log('3. LISTING.IMAGE HAS BEEN CREATED:', newListing.image)
  try {
    await newListing.save()
    req.flash('success', 'New Listing Created')
    res.redirect('/listings')
  } catch (error) {
    console.error('Error saving listing:', error)
    next(error)
  }
}

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params
  const listing = await Listing.findById(id)
  if (!listing) {
    req.flash(
      'error',
      'The listing you requested for does not exist anymore, like your self esteem.'
    )
    res.redirect('/listings')
  } else {
    res.render('listings/edit.ejs', { listing, categoryData })
  }
}

module.exports.updateListings = async (req, res) => {
  const { id } = req.params;

  let listing = await Listing.findById(id);

  listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash('success', 'Listing Updated');
  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params
  let deletedListing = await Listing.findByIdAndDelete(id)
  req.flash('success', 'Listing Deleted :)')
  console.log(deletedListing)
  res.redirect('/listings')
}

const Joi = require('joi')

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.object({
      url: Joi.required(),
      filename: Joi.required()
    }).optional(),
    price: Joi.number().min(0).required(),
    country: Joi.string().required(),
    category: Joi.string().required(),
    location: Joi.string().required()
  }).required()
})

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
    recommend: Joi.boolean().required(),
    name: Joi.string().required()
  }).required()
})

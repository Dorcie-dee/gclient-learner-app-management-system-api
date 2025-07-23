import Joi from "joi";


export const giveRatingValidator = Joi.object({
  rating: Joi.number()
    .valid(1, 2, 3, 4, 5)
    .required()
    .messages({
      'any.only': 'Rating must be between 1 and 5.',
      'any.required': 'Rating is required.'
    }),
  review: Joi.string()
});


//update
export const updateRatingValidator = Joi.object({
  rating: Joi.number()
    .valid(1, 2, 3, 4, 5)
    .required()
    .messages({
      'any.only': 'Rating must be between 1 and 5.',
      'any.required': 'Rating is required.'
    }),
  review: Joi.string()
});
import Joi from "joi";


export const giveRatingValidator = Joi.object({
  learner: Joi.string().required(),
  track: Joi.string().required(),
  rating: Joi.string()
    .valid("1", "2", "3", "4", "5")
    .required()
    .messages({
      'any.only': 'Rating must be between 1 and 5.',
      'any.required': 'Rating is required.'
    }),
  review: Joi.string()
});


//update
export const updateRatingValidator = Joi.object({
  learner: Joi.string().required(),
  track: Joi.string().required(),
  rating: Joi.string()
    .valid("1", "2", "3", "4", "5")
    .required()
    .messages({
      'any.only': 'Rating must be between 1 and 5.',
      'any.required': 'Rating is required.'
    }),
  review: Joi.string()
});
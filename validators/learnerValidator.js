import Joi from "joi";


//update learner 
export const updateLearnerValidator = Joi.object({
  firstName: Joi.string().trim().messages({
    'string.empty': 'First name is required',
  }),

  lastName: Joi.string().trim().messages({
    'string.empty': 'Last name is required',
  }),

  email: Joi.string().email().lowercase().trim().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  contact: Joi.string(),

  description: Joi.string(),

  profileImage: Joi.string(),

  location: Joi.string(),

  password: Joi.string().min(6).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),

});


//password update/change
export const updateLearnerPasswordValidator = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.valid(Joi.ref("newPassword")).required()
});


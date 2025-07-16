import Joi from "joi";


//admin
export const registerAdminValidator = Joi.object({
  firstName: Joi.string().trim().required().messages({
    'string.empty': 'First name is required',
  }),

  lastName: Joi.string().trim().required().messages({
    'string.empty': 'Last name is required',
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  contact: Joi.string().required(),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
}).with('password', 'confirmPassword');


//learner 
export const registerLearnerValidator = Joi.object({
  firstName: Joi.string().trim().required().messages({
    'string.empty': 'First name is required',
  }),

  lastName: Joi.string().trim().required().messages({
    'string.empty': 'Last name is required',
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
}).with('password', 'confirmPassword');


//email + OTP verification
export const verifyAdminValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),

  verificationToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Verification token is required',
    }),
});


export const resendVerificationValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),
});


//login
export const loginValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),

  contact: Joi.string().required(),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
})

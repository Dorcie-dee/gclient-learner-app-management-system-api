import Joi from "joi";


export const createInvoiceValidator = Joi.object({
  learner: Joi.string().required(),

  paystackCallbackUrl: Joi.string().uri().required(),

  amount: Joi.number().min(1).optional(),

  dueDate: Joi.date().optional(),
  
  paymentDetails: Joi.string().optional(),
});


//invoice update
export const updateInvoiceValidator = Joi.object({
  learner: Joi.string().required(),

  paystackCallbackUrl: Joi.string().uri().required(),

  amount: Joi.number().min(1).optional(),

  dueDate: Joi.date().optional(),
  
  paymentDetails: Joi.string().optional(),

  status: Joi.string().valid('pending', 'paid', 'failed').optional()
});
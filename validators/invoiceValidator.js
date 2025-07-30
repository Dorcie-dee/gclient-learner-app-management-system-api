import Joi from "joi";

export const createInvoiceValidator = Joi.object({
  learner: Joi.string().required(),
    // .custom((value, helpers) => {
    //   if (!mongoose.Types.ObjectId.isValid(value)) {
    //     return helpers.message('Invalid learner ID');
    //   }
    //   return value;
    // }),

  paystackCallbackUrl: Joi.string().uri().required(),

  amount: Joi.number().min(1).optional(),

  dueDate: Joi.date().optional(),
  
  paymentDetails: Joi.string().optional(),
});
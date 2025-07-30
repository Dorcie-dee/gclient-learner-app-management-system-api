import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";


const invoiceSchema = new Schema({
  learnerId: {
    type: Types.ObjectId,
    ref: 'Learner',
    required: true
  },

  track: {
    type: Types.ObjectId,
    ref: 'Track',
    required: true
  },

  amount: { type: Number, required: true },

  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  dueDate: {
    type: Date,
    required: true
    // default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 days from now
  },

  paymentLink: { type: String },

  paystackCallbackUrl: {type: String},

  paymentDetails: { type: String },
  // "paymentLink": "https://checkout.paystack.com/tpbz7t2prv1s3i1",

}, {timestamps: true}
);


invoiceSchema.plugin(normalize);

export const invoiceModel = model('Invoice', invoiceSchema);

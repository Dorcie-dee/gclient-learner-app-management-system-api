import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";


const invoiceSchema = new Schema({
  learner: {
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

  amountPaid: { type: Number, default: 0 }, //how much learner has actually paid


  status: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' },

  paymentType: {
    type: String,
    enum: ['half', 'full'],
    required: true
  },

  dueDate: {
    type: Date,
    required: true
    // default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 days from now
  },

  paymentLink: { type: String },

  paystackCallbackUrl: { type: String },

  paymentDetails: { type: String },

  //for invoice webhook
  paidAt: { type: String },

  reference: { type: String }

}, { timestamps: true }
);


invoiceSchema.plugin(normalize);

export const invoiceModel = model('Invoice', invoiceSchema);

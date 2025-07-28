import { required } from "joi";
import { Schema, Types } from "mongoose";



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
  amount: {type: Number, required: true},
  status: {type: String, enum: ['pending', 'completed']},
  paymentLink: {type: String, required: true},
  paymentDetails: {type: String},
  dueDate: {type: Date, default: Date.now, timestamps},
    // "dueDate": "2025-04-18T22:20:42.185Z",
    // "paymentLink": "https://checkout.paystack.com/tpbz7t2prv1s3i1",
    // "paymentDetails": "Invoice for Full Stack Development course",
});


import { Schema, model } from "mongoose";
import normalize from "normalize-mongoose";

const learnerSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['Admin', 'Learner'],
    default: 'Learner',
    required: true
  },

  contact: { type: String, trim: true },

  description: { type: String },

  location: { type: String },

  profileImage: { type: String },

  disabled: { type: Boolean, default: false},

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationToken: {
    type: String,
  },

  verificationTokenExpiresAt: {
    type: Date,
  },

  lastLogin: {
    type: Date,
    default: Date.now,
  },

  resendAttempts: { type: Number, default: 0 },

  lastResendAt: { type: Date },

}, {
  timestamps: true,
});


// Normalize removes _id, and adds id)
learnerSchema.plugin(normalize);

export const learnerModel = model('Learner', learnerSchema);

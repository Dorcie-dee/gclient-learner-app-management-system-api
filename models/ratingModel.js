import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";

const ratingSchema = new Schema({
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

  rating: {type: Number, enum: [1, 2, 3, 4, 5], required: true},

  review: {type: String}

}, {timestamps: true});

ratingSchema.plugin(normalize);

export const ratingModel = model('Rating', ratingSchema);
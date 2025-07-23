import { Schema, Types, model } from "mongoose";
import normalize from "normalize-mongoose";


const trackSchema = new Schema({
  admin: {
    type: Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  name: {
    type: String,
    // enum: ["Software Engineering", "Cloud Computing", "Data Science", "UI/UX"],
    required: [true, "Track name is required"]
  },
  price: { type: Number, required: true },
  instructor: { type: String, required: true },
  duration: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },

  // courses: [
  //   {
  //     type: Types.ObjectId,
  //     ref: 'Course'
  //   }
  // ],

  // ratings: [
  //   {
  //     type: Types.ObjectId,
  //     ref: 'Rating'
  //   }
  // ]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



//the virtual automatically adds any available rating and course to the tracks when they are called. this makes the db lightweight since I don't have to re-reflect the data that comes with the course and rating. It's like a mirror analogy

//virtual: Get all courses for this track
trackSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'track'
});

//virtual: Get all ratings for this track
trackSchema.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'track'
});



//Normalize removes _id, and adds id
trackSchema.plugin(normalize);

export const trackModel = model('Track', trackSchema);
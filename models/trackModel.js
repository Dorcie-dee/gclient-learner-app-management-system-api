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

  courses: [
    {
      type: Types.ObjectId,
      ref: 'Course'
    }
  ],

  ratings: [
    {
      type: Types.ObjectId,
      ref: 'Rating'
    }
  ]

}, { timestamps: true });


//Normalize removes _id, and adds id
trackSchema.plugin(normalize);

export const trackModel = model('Track', trackSchema);
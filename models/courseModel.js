import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";


const courseSchema = new Schema({
  admin: {
    type: Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  track: {
    type: Types.ObjectId,
    ref: 'Track',
    required: true
  },

  title: { type: String, required: true },

  image: { type: String, required: true },

  // stacks: {type: String, required: true},

  description: { type: String, required: true }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// courseSchema.virtual('track', {
//   ref: 'Track',
//   localField: '_id',
//   foreignField: 'course'
// });

courseSchema.plugin(normalize);

export const courseModel = model('Course', courseSchema);
import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";


const courseSchema = new Schema({
  admin: {
    type: Types.ObjectId,
    ref: 'Admin',
    required: true
  },

  title: {type: String, required: true},
  
  track: {type:Number, required: true},
  
  image: {type: String, required: true},
  
  stacks: {type: String, required: true},
  
  description: {type: String, required: true}
  
}, {timestamps: true});


courseSchema.plugin(normalize);

export const courseModel = model('Course', courseSchema);
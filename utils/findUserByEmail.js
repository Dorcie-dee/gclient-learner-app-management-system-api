import { adminModel } from "../models/adminModel.js";
import { learnerModel } from "../models/learnerModel.js";


export const findUserByEmail = async (email) => {
  let user = await adminModel.findOne({ email });
  if (user) return { user, role: "Admin" };

  user = await learnerModel.findOne({ email });
  if (user) return { user, role: "Learner" };

  return { user: null, role: null };
};
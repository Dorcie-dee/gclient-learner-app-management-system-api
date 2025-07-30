import { learnerModel } from "../models/learnerModel.js";
import { updateLearnerPasswordValidator, updateLearnerValidator } from "../validators/learnerValidator.js";



//learner profile update using put
export const updateLearner = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Validate incoming request
    const { error, value } = updateLearnerValidator.validate({
      ...req.body,
      profileImage: req.file?.filename
    },
      {
        stripUnknown: false,
        abortEarly: false
      });


    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }


    const result = await learnerModel.findByIdAndUpdate(
      req.auth.id,
      { $set: value },
      { new: true, runValidators: true },
    );

    // If no record is found, return a 404 error
    if (!result) {
      return res.status(404).json({ message: "Learner not found" });
    }

    // Return the updated document
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


//password update/change
export const updateLearnerPassword = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    //validating input
    const { error, value } = updateLearnerPasswordValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //extracting validated data
    const { currentPassword, newPassword } = value;

    //updating user password
    const updatedPassword = await learnerModel.findById(
      req.auth.id
    );
    //comparing password
    const isTheSame = await bcrypt.compare(currentPassword, updatedPassword.password);

    if (!isTheSame) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    updatedPassword.password = await bcrypt.hash(newPassword, 10);
    await updatedPassword.save();

    res.status(200).json({
      message: "Password updated successfully",
      pass: updatedPassword
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


//get all learners
export const getAllLearners = async (req, res) => {
  try {
    // Fetch learners with related data
    const learners = await learnerModel
      .find()
      .select("-password")
    res.status(200).json({
      success: true,
      count: learners.length,
      data: learners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve learners",
      error: error.message
    });
  }
};


//get single learner
export const getSingleLearner = async (req, res) => {
  try {
    const { id } = req.params;

    const learner = await learnerModel.findById(id).select("-password");
    if (!learner) {
      return res.status(404).json({ message: "Learner not found" })
    };

    res.status(200).json({
      success: true,
      data: learner
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch learner",
      error: error.message
    });
  }
};


//logout
export const logoutLearner = async (req, res) => {
  try {
    //verify token using middleware
    const learnerId = req.auth?.id;

    if (!learnerId) {
      return res.status(401).json({ message: "Unauthorized: Learner not authenticated" });
    }

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
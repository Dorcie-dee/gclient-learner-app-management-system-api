import { ratingModel } from "../models/ratingModel.js";
import { giveRatingValidator, updateRatingValidator } from "../validators/ratingValidator.js";


//learner give rating
export const giveRating = async (req, res) => {
  try {
    const { error, value } = giveRatingValidator.validate(req.body)
    if (error) {
      return res.status(422).json(error)
    };

    // Check for existing rating by this learner on the same track
    const existing = await ratingModel.findOne({
      learner: req.auth.id,
      track: value.track,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already rated this track.",
      });
    }

    const incomingRating = await ratingModel.create({
      ...value,
      learner: req.auth.id,
    });

    //save rating
    res.status(201).json({
      success: true,
      message: "Rating submitted successfully.",
      rating: incomingRating,
    });

  } catch (error) {
    return res.status(409).json(error.message);
  }
}


//get all ratings
export const getAllRatings = async (req, res, next) => {
  try {
    // Fetch tracks with related data
    const ratings = await ratingModel
      .find()
      .populate({
        path: 'admin', //ref in trackModel
        select: 'firstName lastName email role contact isVerified lastLogin createdAt updatedAt profileImage location description resetTokenExpires resetToken'
      })
      .populate({
        path: 'courses', //ref in trackModel
        select: '_id admin track title stacks image createdAt updatedAt'
      })
      .populate({
        path: 'ratings', //ref in trackModel
        select: '_id learner track rating review createdAt updatedAt'
      })
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      success: true,
      count: ratings.length,
      ratings
    });
  } catch (error) {
    next(error);
  }
};


//get rating by id
export const getRatingById = async (req, res) => {
  try {

    const getRatingById = await ratingModel.findById(req.params.id).exec();
    if (!getRatingById) {
      return res.status(404).json({ message: "No rating found" })
    };

    res.status(200).json(getRatingById);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get ratings by one learner
export const getLearnerRatings = async (req, res) => {
  try {
    //find the learner id
    const learner = req.auth.id
    //check if learner has posted tracks
    const rates = await ratingModel.find({ learner }).exec();
    if (!tracks) {
      return res.status(404).json({ message: "No data found!" })
    };
    res.status(200).json(rates);

  } catch (error) {
    res.status(500).json({ error: error.message });

  }
};


//update rating
export const updateRating = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = updateRatingValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    // Update the rating
    const result = await adModel.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    // Check if the track exists
    if (!result) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Return the updated track
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


//delete rating
export const deleteRating = async (req, res, next) => {
  try {

    const { id } = req.params;
    await trackModel.findByIdAndDelete(id).exec();
    if (!updateRate) {
      return res.status(404).json({
        message: "Rating not found!",
      });
    }

    res.json({ message: "Rating deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//get track ratings
export const getTrackRating = async (req, res) => {
  try {

    const getTrackRate = await trackModel.findById(req.params.id).exec();
    if (!getTrackRate) {
      return res.status(404).json({ message: "Rating not found" })
    };

    res.status(200).json(getTrackRate);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

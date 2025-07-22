import { trackModel } from "../models/trackModel.js";
import { createTrackValidator, updateTrackValidator } from "../validators/trackValidator.js";


//add a track
export const createTrack = async (req, res, next) => {
  try {

    // Dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    const { error, value } = createTrackValidator.validate({
      ...req.body,
      image
    }, { abortEarly: false });
    if (error) {
      return res.status(422).json(error)
    };

    //save track
    const incomingTrack = await trackModel.create({
      value,
      admin: req.auth.id
    });
    res.status(201).json({
      success: true,
      message: "Track created successfully",
      track: incomingTrack
    });

  } catch (error) {
    if (error.name === 'MongooseError') {
      return res.status(409).json(error.message);
    }
  }
  next(error);
}


//get all tracks
export const getAllTracks = async (req, res, next) => {
  try {
    // Fetch tracks with related data
    const tracks = await trackModel
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
      count: tracks.length,
      tracks
    });
  } catch (error) {
    next(error);
  }
};


//get track by id
export const getTrackById = async (req, res) => {
  try {

    const getTrackById = await trackModel.findById(req.params.id).exec();
    if (!getTrackById) {
      return res.status(404).json({ message: "Ad not found" })
    };

    res.status(200).json(getTrackById);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get tracks by one admin
export const getAdminTracks = async (req, res) => {
  try {
    //find the admin id
    const admin = req.auth.id
    //check if admin has posted tracks
    const tracks = await trackModel.find({ admin }).exec();
    if (!tracks) {
      return res.status(404).json({ message: "No admin data found!" })
    };
    res.status(200).json(tracks);

  } catch (error) {
    res.status(500).json({ error: error.message });

  }
};


//update track
export const updateTrack = async (req, res, next) => {
  try {

    // Dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    // Validate request body
    const { error, value } = updateTrackValidator.validate({
      ...req.body,
      image
    });
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }
    // console.log(error)

    // Update the track
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


//delete track
export const deleteTrack = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    } //or i can just add isAuthorised at the router side

    const { id } = req.params;
    await trackModel.findByIdAndDelete(id).exec();
    if (!updateTrack) {
      return res.status(404).json({
        message: "Track not found!",
      });
    }

    res.json({ message: "Track deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




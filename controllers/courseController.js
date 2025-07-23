import { courseModel } from "../models/courseModel.js";
import { createCourseValidator } from "../validators/courseValidator.js";



export const createCourse = async (req, res, next) => {
  try {

    // Dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    const { error, value } = createCourseValidator.validate({
      ...req.body,
      image
    }, { abortEarly: false });
    if (error) {
      return res.status(422).json(error)
    };


    // Fetch tracks with related data
    const tracks = await trackModel
      .find()
      .populate({
        path: 'admin', //ref in trackModel
        select: 'firstName lastName email role contact isVerified lastLogin createdAt updatedAt profileImage location description resetTokenExpires resetToken'
      })
      .populate({
        path: 'courses', //ref in trackModel
        // select: '_id admin track title stacks image createdAt updatedAt'
        select: '-_v'
      })
      .populate({
        path: 'ratings', //ref in trackModel
        // select: '_id learner track rating review createdAt updatedAt'
        select: '-_v'
      })
      .sort({ createdAt: -1 }); // Latest first


    //save course
    const incomingCourse = await courseModel.create({
      ...value,
      admin: req.auth.id
    });
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      track: incomingCourse
    });

  } catch (error) {
    console.error('Course creation error:', error);

    return res.status(500).json({
      message: 'Server error',
      error: error.message || 'Unknown error',
    });
  }
  next(error);
}




export const createCourses = async (req, res) => {
  const { title, description, track } = req.body;

  if (!title || !description || !track) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if track exists
  const trackExists = await trackModel.findById(track);
  if (!trackExists) {
    return res.status(404).json({ success: false, message: "Track not found" });
  }



  const newCourse = await courseModel.create({
    admin: req.user._id,
    title,
    description,
    track,
    image: imageUrl || 'default_image_url_here'
  });

  const populatedCourse = await newCourse
    .populate({
      path: 'admin',
      select: '-password'
    })
    .populate('track')
    .execPopulate?.() || newCourse;

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course: populatedCourse
  });
};

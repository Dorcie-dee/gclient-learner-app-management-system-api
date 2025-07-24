import { courseModel } from "../models/courseModel.js";
import { trackModel } from "../models/trackModel.js";
import { createCourseValidator, updateCourseValidator } from "../validators/courseValidator.js";



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

    const { track } = value;

    // Check if track exists
    const trackExists = await trackModel.findById(track);
    if (!trackExists) {
      return res.status(404).json({ success: false, message: "Track not found" });
    }

    //save course
    const incomingCourse = await courseModel.create({
      ...value,
      admin: req.auth.id
    });

    //fetch admin and track related data
    const populatedCourse = await courseModel.findById(incomingCourse._id)
      .populate({
        path: 'admin', //ref in courseModel
        select: 'firstName lastName email role contact isVerified lastLogin createdAt updatedAt'
      })
      .populate({
        path: 'track', //ref in courseModel
        select: 'name price instructor duration image description createdAt updatedAt'
      })
      .lean();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: populatedCourse
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


//update course
export const updateCourse = async (req, res, next) => {
  try {
    const image = req.file?.path || req.body.image;

    //validating request body
    const { error, value } = updateCourseValidator.validate({
      ...req.body, image
    }, { abortEarly: false });
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    const courseId = req.params.id;

    //check if course exists
    const existingCourse = await courseModel.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    //update course
    const updatedCourse = await courseModel.findByIdAndUpdate(courseId, value,
      {
        new: true,
        runValidators: true,
      })
      .populate({
        path: 'admin', //ref in courseModel
        select: 'firstName lastName'
      })
      .populate({
        path: 'track', //ref in courseModel
        select: 'name instructor duration'
      })
      .lean();;

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
  next();

};


//get all courses
export const getAllCourses = async (req, res) => {
  try {
    const {
      title = "",               //filter by course title (e.g. React.Js, etc)
      track = "",               //filter by track (e.g. UI/UX, Software Development, etc)
      admin = "",               //filter by admin who created the course
      sortBy = 'createdAt',     //field to sort by (default is date of creation)
      order = 'desc',           //default order
      page = 1,                 //page number for pagination
      limit = 10                //number of courses per page
    } = req.query;


    //filter query
    const query = {
      ...(title && { title: { $regex: title, $options: 'i' } }),
      ...(admin && { admin: { $regex: admin, $options: 'i' } }),
      ...(track && { track: { $regex: track, $options: 'i' } })
    };

    //sorting logic
    const sortField = sortBy;
    const sortOrder = order === 'asc' ? 1 : -1; //convert sort order to MongoDB format (1 for asc, -1 for desc)

    //pagination logic
    const pageNumber = Number(page) || 1;         //convert page to number; default to 1
    const pageSize = Number(limit) || 10;         //number of listed courses on a page (limit, 10)
    const skip = (pageNumber - 1) * pageSize;     //calculate number of documents to skip


    //count total courses matching the filter (used for totalPages)
    const totalCourses = await courseModel.countDocuments(query);

    //retrieve filtered, sorted, paginated data
    const courses = await courseModel.find(query)
      .sort({ [sortField]: sortOrder })           //apply sorting
      .skip(skip)                                 //apply skip for pagination
      .limit(pageSize)                            //limit number of courses per page
      .lean();                                    //return plain JavaScript objects (better performance)

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      //metadata for Frontend Pagination UI
      count: courses.length,                                //number of courses returned on this page only
      page: pageNumber,                                     //current page number
      totalPages: Math.ceil(totalCourses / pageSize),       //total number of pages available
      totalCourses,                                         //total num of matching courses in db(b4pagination)
      //actual course data
      allCourses: courses
    });



  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


//get single course
export const getSingleCourse = async (req, res) => {
  try {
    const courseId = req.params.id

    //check if course exists
    const existingCourse = await courseModel.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      existingCourse
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}


//delete course
export const deleteCourse = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const courseId = req.params.id

    //if course exists
    const existingCourse = await courseModel.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    await courseModel.findByIdAndDelete(courseId)
    return res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
}
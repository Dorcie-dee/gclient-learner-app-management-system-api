import { Router } from "express";
import { createCourse, deleteCourse, getAllCourses, getSingleCourse, updateCourse } from "../controllers/courseController.js";
import { courseImageUpload } from "../middlewares/imageUpload.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";



const courseRouter = Router();

courseRouter.post('/courses', isAuthenticated, isAuthorized(['Admin']), courseImageUpload.single('image'), createCourse);

//update course
courseRouter.put('/courses/:id', isAuthenticated, isAuthorized(['Admin']), courseImageUpload.single('image'), updateCourse);

//all courses or search courses
courseRouter.get('/courses', isAuthenticated, getAllCourses);

//single course
courseRouter.get('/courses/:id', isAuthenticated, getSingleCourse);

//delete course
courseRouter.delete('/courses/:id', isAuthenticated, isAuthorized(['Admin']), deleteCourse);




export default courseRouter;
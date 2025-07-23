import { Router } from "express";
import { createCourse } from "../controllers/courseController.js";
import { courseImageUpload } from "../middlewares/imageUpload.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";



const courseRouter = Router();

// courseRouter.post('/courses', course);
courseRouter.post('/courses', isAuthenticated, isAuthorized(['Admin']), courseImageUpload.single('image'), createCourse);





export default courseRouter
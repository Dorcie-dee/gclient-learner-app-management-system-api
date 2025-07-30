import { Router } from "express";
import { getAllLearners, getSingleLearner, logoutLearner, updateLearner, updateLearnerPassword } from "../controllers/learnerController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { learnerImageUpload } from "../middlewares/imageUpload.js";

const learnerRouter = Router();

//for register learner, check authRoute.js


//updating user profile
learnerRouter.put('/learners/:id', isAuthenticated, isAuthorized(['Learner']), learnerImageUpload.single('profileImage'), updateLearner);


//all learners
learnerRouter.get('/learners', isAuthenticated, getAllLearners);


//single learner
learnerRouter.get('/learners/:id', isAuthenticated, getSingleLearner);


//for learner get authenticated user info, check authROute.js


//change password
learnerRouter.post('/learner/change-password', isAuthenticated, updateLearnerPassword);


//logout
learnerRouter.post('/learner/logout', isAuthenticated, logoutLearner);




export default learnerRouter;
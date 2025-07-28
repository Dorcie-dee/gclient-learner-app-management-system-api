import { Router } from "express";
import { getOneLearner, logoutLearner, updateLearner, updateLearnerPassword } from "../controllers/learnerController.js";

const learnerRouter = Router();

//for register learner, check authRoute.js


//updating user profile
learnerRouter.put('/learners/:id', isAuthenticated, updateLearner);


//single learner
trackRouter.get('/learners/:id', getOneLearner);


//for learner get authenticated user info, check authROute.js


//change password
learnerRouter.post('/learner/change-password', isAuthenticated, updateLearnerPassword);


//logout
learnerRouter.post('/learner/logout', isAuthenticated, logoutLearner);




export default learnerRouter;
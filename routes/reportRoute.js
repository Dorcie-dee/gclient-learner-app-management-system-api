import { Router } from "express";
import { getIncomePerTrack, getLearnersPerTrack, getTotalIncome, getTotalLearners } from "../controllers/reportController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";


const reportRouter = Router();

reportRouter.get("/total-learners", isAuthenticated, isAuthorized(['Admin']), getTotalLearners);

//report on learners per track
reportRouter.get("/learners-per-track", isAuthenticated, isAuthorized(['Admin']), getLearnersPerTrack);

//report on total  income generated
reportRouter.get("/total-income", isAuthenticated, isAuthorized(['Admin']), getTotalIncome);

//report on income per track
reportRouter.get("/income-per-track", isAuthenticated, isAuthorized(['Admin']), getIncomePerTrack);

export default reportRouter;

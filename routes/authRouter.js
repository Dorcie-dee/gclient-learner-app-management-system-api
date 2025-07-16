import { Router } from "express";
import { forgotPassword, getAuthenticatedUser, loginUser, registerAdmin, registerLearner, resendVerificationEmail, resetPassword, updatePassword, verifyUser 
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const authRouter = Router();

//register new admin
authRouter.post('/signup/admin', registerAdmin);

//register learner
authRouter.post('/signup/learner', registerLearner);

//verify email with OTP token
authRouter.post('/verify-email', verifyUser);

//resend verification token (with rate limiting)
authRouter.post('/resend-token', resendVerificationEmail);

//login admin and learner
authRouter.post('/login', loginUser);

//forgot password
authRouter.post('/forgot-password', forgotPassword);

//resend password
authRouter.post('/reset-password/:token', resetPassword);

//change password
authRouter.post('/change-password', isAuthenticated, updatePassword);

//get authenticated user info
authRouter.post('/check-auth', getAuthenticatedUser);




export default authRouter;

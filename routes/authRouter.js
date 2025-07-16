import { Router } from "express";
import { registerAdmin, registerLearner, resendVerificationEmail, verifyAdmin 
} from "../controllers/authController.js";

const authRouter = Router();

//register new admin
authRouter.post('/signup/admin', registerAdmin);

//register learner
authRouter.post('/signup/admin', registerLearner);

//verify email with OTP token
authRouter.post('/verify-email', verifyAdmin);

//resend verification token (with rate limiting)
authRouter.post('/resend-token', resendVerificationEmail);




export default authRouter;

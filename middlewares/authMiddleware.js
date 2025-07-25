import { expressjwt } from "express-jwt";
import { adminModel } from "../models/adminModel.js";
import { learnerModel } from "../models/learnerModel.js";

export const isAuthenticated = expressjwt({
    secret: process.env.JWT_SECRET_KEY,
    algorithms: ['HS256'],
    requestProperty: 'auth'
});


//authorization
export const isAuthorized = (roles) => {
    return async (req, res, next) => {
        try {
            let user = await adminModel.findById(req.auth.id);
            let role = 'Admin';

            if (!user) {
                user = await learnerModel.findById(req.auth.id);
                role = 'Learner';
            }

            // const user = await adminModel.findById(req.auth.id);
            if (!user) {
                return res.status(404).json('User not found');
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json('You are not authorized')
            }
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json('Authorization error')
        }
    };
};

import { Router } from "express";
import { createTrack, deleteTrack, getAdminTracks, getAllTracks, getTrackById, updateTrack } from "../controllers/trackController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { trackImageUpload } from "../middlewares/imageUpload.js";
import { giveRating } from "../controllers/ratingController.js";


const trackRouter = Router();

//all tracks in db
trackRouter.get('/tracks', getAllTracks);

//track by id
trackRouter.get('/tracks/:id', getTrackById);

//get an admin's posted tracks
trackRouter.get('/tracks', isAuthenticated, getAdminTracks);

//create a track
trackRouter.post('/tracks', isAuthenticated, isAuthorized(['Admin']), trackImageUpload, createTrack);

//update
trackRouter.put('/tracks/:id', isAuthenticated, isAuthorized(['Admin']), trackImageUpload, updateTrack);

//delete
trackRouter.delete('/tracks/:id', isAuthenticated, isAuthorized(['Admin']), deleteTrack);

//get track ratings
trackRouter.get('/tracks/:id/ratings', isAuthenticated, get);

//post track ratings
trackRouter.post('/tracks/:id/ratings', isAuthenticated,isAuthorized(['Learner']), giveRating);

export default trackRouter;
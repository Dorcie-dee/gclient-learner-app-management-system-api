import { Router } from "express";
import { createTrack, deleteTrack, getAdminTracks, getAllTracks, getTrackById, searchTracks, updateTrack } from "../controllers/trackController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { trackImageUpload } from "../middlewares/imageUpload.js";
import { getRatingForTrack, giveRating } from "../controllers/ratingController.js";


const trackRouter = Router();

//create a track
trackRouter.post('/tracks', isAuthenticated, isAuthorized(['Admin']), trackImageUpload.single('image'), createTrack);

//all tracks in db
trackRouter.get('/tracks', getAllTracks);

//search tracks
trackRouter.get('/tracks/search', searchTracks);

//track by id
trackRouter.get('/tracks/:id', getTrackById);

//get an admin's posted tracks
trackRouter.get('/tracks/admin', isAuthenticated, getAdminTracks);

//update
trackRouter.put('/tracks/:id', isAuthenticated, isAuthorized(['Admin']), trackImageUpload.single('image'), updateTrack);

//delete
trackRouter.delete('/tracks/:id', isAuthenticated, isAuthorized(['Admin']), deleteTrack);

//get track ratings
trackRouter.get('/tracks/:id/ratings', isAuthenticated, getRatingForTrack);

//post track ratings
trackRouter.post('/tracks/:id/ratings', isAuthenticated,isAuthorized(['Learner']), giveRating);



export default trackRouter;
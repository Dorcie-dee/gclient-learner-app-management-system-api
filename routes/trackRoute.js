import { Router } from "express";
import { createTrack, deleteTrack, getAdminTracks, getAllTracks, getTrackById, updateTrack } from "../controllers/trackController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";


const trackRouter = Router();

//all tracks in db
trackRouter.get('/tracks', getAllTracks);

//track by id
trackRouter.get('/tracks/:id', getTrackById);

//get an admin's posted tracks
trackRouter.get('/tracks', isAuthenticated, getAdminTracks);

//create a track
trackRouter.post('/tracks', isAuthenticated, isAuthorized(['Admin']), createTrack);

//update
trackRouter.put('/tracks', isAuthenticated, isAuthorized(['Admin']), updateTrack);

//delete
trackRouter.delete('/tracks', isAuthenticated, isAuthorized(['Admin']), deleteTrack);

export default trackRouter;
import multer from "multer";
import {v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from "multer-storage-cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//track image upload
export const trackImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "/gclient-api/track/image-upload"
    },
  }),
});


//course image upload
export const courseImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "/gclient-api/courses/image-upload"
    },
  }),
});


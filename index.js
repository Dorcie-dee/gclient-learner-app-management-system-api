import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import authRouter from "./routes/authRouter.js";


//database connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");

    //listening for incoming request
    app.listen(port, () => {
      console.log(`Server listening attentively`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
  }
})();

//create an express app
const app = express();
const port = process.env.PORT || 5000;

//global middlewares
app.use(cors());
app.use(express.json());

//use routes
app.use("/api/auth", authRouter);





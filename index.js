import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import authRouter from "./routes/authRouter.js";
import trackRouter from "./routes/trackRoute.js";
import courseRouter from "./routes/courseRoute.js";
import learnerRouter from "./routes/learnerRoute.js";
import webhookRouter from "./routes/webhookRoute.js";
import invoiceRouter from "./routes/invoiceRouter.js";
import reportRouter from "./routes/reportRoute.js";


//database connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");

    
    app.get("/", (req, res) => {
      res.json({
        status: "success",
        message: "GClient Learner App Management System API",
        testSignupEndpoint: "/api/auth/signup/learner (POST)"
      });
    });


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
app.use("/api", learnerRouter);
app.use("/api", trackRouter);
app.use("/api", courseRouter);
app.use("/api", invoiceRouter);
app.use("/api", webhookRouter);
app.use("/api/reports", reportRouter);





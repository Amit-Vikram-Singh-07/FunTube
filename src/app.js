import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  Credential: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({limit:"20kb"}));
app.use(express.urlencoded({extended:true,limit:"20kb"}));
app.use(express.static("public"));
app.use(cookieParser());


// routes import
import userRouter  from "./routes/user.route.js";
import commentRouter from "./routes/comment.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";
import tweetRouter from "./routes/tweet.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import playlistRouter from "./routes/playlist.route.js";

// routes declaration
app.use("/api/v1/users",userRouter);

app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/dashboard",dashboardRouter);
app.use("/api/v1/healthcheck",healthcheckRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/playlist",playlistRouter);


// URL : htttps://localhost:8080//api/v1/users

export default app;

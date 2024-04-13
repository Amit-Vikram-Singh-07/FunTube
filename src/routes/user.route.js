import router from "express";
import registerUser from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";

const userRouter = router();

// Define routes
//Till now  URL : htttps://localhost:8080//api/v1/users/register
userRouter
  .route("/register")
  .post(
    upload.fields(
      { name: "avatar", maxCount: 1 },
      { name: "coverImg", maxCount: 1 }
    ),
    registerUser
  );

// Add more routes as needed
export default userRouter;

import router  from "express";
import  registerUser  from "../controllers/user.controller.js";

const userRouter = router();

// Define routes
userRouter.route("/register").post(registerUser);
// URL : htttps://localhost:8080//api/v1/users/register

// Add more routes as needed
export default userRouter ;

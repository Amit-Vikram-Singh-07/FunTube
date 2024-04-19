import router from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImg
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = router();

// Define routes
//Till now  URL : htttps://localhost:8080//api/v1/users/register
userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImg", maxCount: 1 },
  ]),
  registerUser
);
userRouter.route("/login").post(loginUser);

// Secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJWT, changePassword);
userRouter.route("/current-user").post(verifyJWT, getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);
userRouter.route("/change-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
  );
userRouter.route("/change-coverImg").patch(
    verifyJWT,
    upload.single("coverImg"),
    updateUserCoverImg
  );
userRouter.route("/channel-profile/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);



// Add more routes as needed
export default userRouter;

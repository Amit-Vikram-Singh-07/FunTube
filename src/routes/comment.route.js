import router from "express";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRouter = router();


// Defining routes 
commentRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

commentRouter.route("/:videoId").get(getVideoComments).post(addComment);
commentRouter.route("/:commentId").delete(deleteComment).patch(updateComment);

export default commentRouter;
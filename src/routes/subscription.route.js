import router from "express";
import {
    getSubscribedChannels,
    getChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriptionRouter = router();

subscriptionRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

subscriptionRouter
    .route("/channel/:channelId")
    .get(getChannelSubscribers)
    .post(toggleSubscription);
    
    subscriptionRouter
    .route("/user/:userId")
    .get(getSubscribedChannels)

export default subscriptionRouter;

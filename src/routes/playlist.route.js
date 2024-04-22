import router from "express";
import {
    createPlaylist,
    getChannelPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const playlistRouter = router();

playlistRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

playlistRouter.route("/").post(createPlaylist);
playlistRouter.route("/:playlistId")
                                    .get(getPlaylistById)
                                    .delete(deletePlaylist)
                                    .patch(updatePlaylist);
playlistRouter.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
playlistRouter.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
playlistRouter.route("/channel/:channelId").get(getChannelPlaylists);

export default playlistRouter;

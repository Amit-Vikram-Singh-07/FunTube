import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    try {
        const { name, description } = req.body;
        if (!name || !description) {
            throw new apiError(400, "Name and Description are required field. !!");
        }
        const newPlaylist = await Playlist.create({
            name: name,
            description: description,
            owner: req.user?._id,
        });
        if (!newPlaylist) {
            throw new apiError(500, "Error while creating new playlist. !!");
        }
        res
            .status(200)
            .json(new apiResponse(200, { "New playlist :": newPlaylist }));
    } catch (error) {
        throw new apiError(400, "Failed to create new playlist. !!", error);
    }
});

const getChannelPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    try {
        const { channelId } = req.params;
        if (!channelId) {
            throw new apiError(400, "Channel id is required. !!");
        }
        if (!isValidObjectId(channelId)) {
            throw new apiError(400, "Invalid channel ID. !!");
        }
        const playlists = await Playlist.find({ owner: channelId });
        console.log("Playlists of channel : ",playlists);
        if (!playlists) {
            throw new apiError(404, "No playlists found for the channel. !!");
        }
        res
            .status(200)
            .json(new apiResponse(200, { playlists }, "User playlists retrieved successfully."));
    } catch (error) {
        throw new apiError(error.statusCode || 500, error.message || "Failed to fetch user playlists. !!");
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    try {
        const { playlistId } = req.params;
        if (!playlistId) {
            throw new apiError(400, "Playlist id is required field. !!");
        }
        if (!isValidObjectId(playlistId)) {
            throw new apiError(400, "Playlist id is not valid. !!");
        }
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new apiError("Some error occoured, while fetching playlist. !!");
        }
        res
            .status(200)
            .json(new apiResponse(200, { playlist }, "Playlist fetched successfully."));
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Failed to fetch the playlist."
        );
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        // Extract playlistId and videoId from request parameters
        const { playlistId, videoId } = req.params;
        if(!playlist || !videoId){
            throw new apiError(400,"Playlist and video id is required field. !!")
        }
        // Validate playlistId and videoId
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid playlist ID or video ID.");
        }
        // Find the playlist by ID
        const playlist = await Playlist.findById(playlistId);
        // Check if the playlist exists
        if (!playlist) {
            throw new apiError(404, "Playlist not found. !!");
        }
        // Check if the video is already in the playlist
        if (playlist.videos.includes(videoId)) {
            throw new apiError(400, "Video is already in the playlist. !!");
        }
        // Add the video to the playlist
        playlist.videos.push(videoId);
        // Save the updated playlist
        await playlist.save({ validateBeforeSave: false });
        const updatedPlaylist = await Playlist.findById(playlistId);
        // Return success response
        res
          .status(200)
          .json(new apiResponse(200, { updatedPlaylist }, "Video added to playlist successfully."));
    } catch (error) {
        throw new apiError(error.statusCode || 500, error.message || "Failed to add video to playlist.");
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        // Extract playlistId and videoId from request parameters
        const { playlistId, videoId } = req.params;
        if(!playlist || !videoId){
            throw new apiError(400,"Playlist and video id is required field. !!")
        }
        // Validate playlistId and videoId
        if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
            throw new apiError(400, "Invalid playlist ID or video ID.");
        }
        // Find the playlist by ID
        const playlist = await Playlist.findById(playlistId);
        // Check if the playlist exists
        if (!playlist) {
            throw new apiError(404, "Playlist not found.");
        }
        if (!playlist.videos.includes(videoId)) {
            throw new apiError(400, "Video is not in the playlist. !!");
        }
        // Remove the video from the playlist
        playlist.videos = playlist.videos.filter(v => v.toString() !== videoId);
        // Save the updated playlist
        await playlist.save({ validateBeforeSave: false });
        const updatedPlaylist = await Playlist.findById(playlistId);
        // Return success response
        res
          .status(200)
          .json(new apiResponse(200, { updatedPlaylist }, "Video removed from playlist successfully."));
    } catch (error) {
        throw new apiError(error.statusCode || 500, error.message || "Failed to remove video from playlist.");
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    try {
        const { playlistId } = req.params;
        if (!playlistId) {
            throw new apiError(400, "Playlist id is required field. !!");
        }
        if (!isValidObjectId(playlistId)) {
            throw new apiError(400, "Playlist id is not valid. !!");
        }
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        if (!deletedPlaylist) {
            throw new apiError(
                500,
                "Some error occoured, while deleting the playlist. !!"
            );
        }
        res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    { deletedPlaylist },
                    "Playlist fetched successfully."
                )
            );
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Failed to fetch the playlist."
        );
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {

    //TODO: update playlist
    try {
        const { playlistId } = req.params;
        const { name, description } = req.body;
        if (!playlistId || !name || !description) {
            throw new apiError(400, "Playlist id, Name and Description are required field. !!");
        }
        if (!isValidObjectId(playlistId)) {
            throw new apiError(400, "Playlist id is not valid. !!");
        }
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            { name: name, description: description },
            { new: true } // To return the updated document
        );
        if (!updatedPlaylist) {
            throw new apiError(500, "Some error occoured, while updating the playlist. !!");
        }
        res
            .status(200)
            .json(new apiResponse(200, { updatedPlaylist }, "Playlist  name and description updated successfully."));
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Failed to update the playlist name and description. !!"
        );
    }
});

export {
    createPlaylist,
    getChannelPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};

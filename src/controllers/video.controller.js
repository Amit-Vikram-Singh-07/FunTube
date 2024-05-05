import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/Playlist.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (page < 1 && limit > 10) {
    throw new apiError(400, "Invalid page number or limit. !!");
  }
  if (!query && !query?.trim()) {
    throw new apiError(400, "Specify query. !!");
  }
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid UserId. !!");
  }
  // find the user from DB
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found. !!");
  }
  // defining search criteria
  const searchCriteria = {};
  if (sortBy && sortType) {
    searchCriteria[sortBy] = sortType === "asc" ? 1 : -1; //assigning the search criteria
  } else {
    searchCriteria["createdAt"] = -1;
  }
  // defining options for aggregate paginate
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: searchCriteria,
  };
  // defining the pipeline
  const videosAggregation = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $match: {
        title: {
          // match title of the video with the query using $regex
          $regex: query,
        },
      },
    },
  ]);
  // using aggregate paginate
  const videos = await Video.aggregatePaginate(videosAggregation, options);
  if (videos.totalDocs === 0) {
    // totalDocs is available as we are using aggregate paginate
    throw new apiError(400, "No videos matched the searched query.");
  }
  // returning response
  return res
    .status(200)
    .json(new apiResponse(200, videos, "videos fetched successfully."));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // Extract title and description from the request body
  const { title, description } = req.body;

  // Check if title and description are provided
  if (!title || !description) {
    throw new apiError(400, "Title and description are required. !!");
  }
  // Check if thumbnail and videoFile are included in the request files
  if (!req.files || !req.files.thumbnail || !req.files.videoFile) {
    throw new apiError(400, "Thumbnail and video file are required. !!");
  }
  try {
    // Upload thumbnail and videoFile to Cloudinary
    const thumbnailCloudResponse = await uploadToCloudinary(
      req.files?.thumbnail[0]?.path
    );
    const videoFileCloudResponse = await uploadToCloudinary(
      req.files?.videoFile[0]?.path
    );

    // Create a new video document with the uploaded URLs
    const publishedVideo = await Video.create({
      title,
      description,
      thumbnail: thumbnailCloudResponse.url,
      videoFile: videoFileCloudResponse.url,
      owner: req.user?._id, // Assuming you have user authentication middleware that adds user info to the request object
    });
    // Return success response with the new video data
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { publishedVideo },
          "Video published successfully."
        )
      );
  } catch (error) {
    // Handle any errors that occur during the process
    throw new apiError(500, "Failed to publish the video. !!");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  try {
    const { videoId } = req.params;
    if (!videoId) {
      new apiError(400, "Video id is required field. !!");
    }
    if (!isValidObjectId(videoId)) {
      new apiError(400, "Video id is invalid. !!");
    }
    const video = await Video.findById(videoId);
    // Actually you need to also fetch the likes, subscriber, duration
    if (!video) {
      new apiError(400, "Video not found. !!");
    }
    // Fetch additional details using separate queries
    const videoLikes = await Like.find({ video: videoId });
    const videoComments = await Comment.find({ video: videoId });
    const channelSubscribers = await Subscription.find({
      channel: video.owner,
    });

    console.log("Video file: ", video);
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { video, videoLikes, videoComments, channelSubscribers },
          "Video fetched successfully."
        )
      );
  } catch (error) {
    throw new apiError(
      error.statusCode || 500,
      error.message || "Failed to fetched the video. !!"
    );
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "Video Id not provided");
  }
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video Id");
  }
  const { title, description, isPublished } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!title || !description || !isPublished) {
    throw new apiError(400, "ALl three fields are required");
  }
  if (!thumbnailLocalPath) {
    throw new apiError(400, "Thumbnail is required field. !!");
  }
  const oldVideo = await Video.findById(videoId);
  const oldThumbnailCloudUrl = oldVideo.thumbnail;

  const thumbnailCloudResponse = await uploadToCloudinary(thumbnailLocalPath);
  if (!thumbnailCloudResponse.url) {
    throw new apiError(
      500,
      "Error while uploading thumbnail on cloudinary. !!"
    );
  }
  await deleteFromCloudinary(oldThumbnailCloudUrl);

  // check if video owner is the current logged in user then update it
  let updatedVideo; // writing it outside due to scope

  if (oldVideo.owner.toString() === req.user._id.toString()) {
    // converted id object to string for comparison
    updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: thumbnailCloudResponse?.url,
        },
      },
      { new: true }
    );
  } else {
    await deleteFromCloudinary(newThumbnail.public_id);
    throw new apiError(
      404,
      "Unauthorized access. You are not the creator of the video."
    );
  }
  if (!updatedVideo) {
    throw new apiError(500, "Video not found after updating the details. !!");
  }
  return res
    .status(200)
    .json(new apiResponse(200, { updatedVideo }, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video

  // taking the videoId from the user through params
  const { videoId } = req.params;
  if (!isValidObjectId(videoId) && !videoId?.trim()) {
    throw new apiError(400, "Invalid videoId.");
  }
  // searching for video in DB
  const deleteVideo = await Video.findById(videoId);
  if (!deleteVideo) {
    throw new apiError(400, "Video not found.");
  }
  // taking out the thumbnail and video file
  const deleteVideoThumbnail = deleteVideo.thumbnail;
  const deleteVideoFile = deleteVideo.videoFile;
  // if the video owner and current logged in user are same the delete the video & its assets
  if (deleteVideo.owner.toString() === req.user._id.toString()) {
    await deleteFromCloudinary(deleteVideoThumbnail);
    await deleteFromCloudinary(deleteVideoFile);

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    const comments = await Comment.find({ video: deletedVideo._id });
    const commentsIds = comments.map((comment) => comment._id); // taking out the commentId

    // if video is deleted delete everything related to the video: likes, comments, remove it fom playlist, comment likes, remove it from watchHistory
    if (deletedVideo) {
      await Like.deleteMany({ video: deletedVideo._id });
      await Like.deleteMany({ comment: { $in: commentsIds } });
      await Comment.deleteMany({ video: deletedVideo._id });
      const playlists = await Playlist.find({ video: deletedVideo._id });
      const users = await User.find({ watchHistory: deletedVideo._id });

      for (const playlist of playlists) {
        await Playlist.findByIdAndUpdate(
          playlist._id,
          {
            $pull: { videos: deletedVideo._id },
          },
          { new: true }
        );
      }

      for (const user of users) {
        await User.findByIdAndUpdate(
          user._id,
          {
            $pull: { watchHistory: deletedVideo._id },
          },
          { new: true }
        );
      }
    } else {
      throw new apiError(400, "Something went wrong while deleting the video.");
    }
  } else {
    throw new apiError(
      400,
      "Unauthorized access. You are not the owner of the video."
    );
  }
  // returning response
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Video deleted successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    if (!videoId) {
      throw new apiError(400, "Video Id is not provided. !!");
    }
    if (!isValidObjectId(videoId)) {
      throw new apiError(400, "Invalid Video Id. !!");
    }
    const toggleVideo = await Video.findById(videoId);
    if (!toggleVideo) {
      throw new apiError(404, "Video not found. !!");
    }
    let toggledVideo;
    if (toggleVideo.owner.toString() === req.user._id.toString()) {
      toggledVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: { isPublished: !toggleVideo.isPublished },
        },
        { new: true }
      );
    } else {
      throw new apiError(400, "Unauthorized access. !!");
    }
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          toggleVideo,
          "isPublished is successfully toggled. !!"
        )
      );
  } catch (error) {
    throw new apiError(
      error.statusCode || 500,
      error.message || "Failed to toggle the publish status video. !!"
    );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};

// add/create/publish a video,
// remove/deleete ,
// video info(title,duration,isPublished, views,thumbnail),
// change/update video,
// toggle isPublished method,
// getVideoById,
// getAllVideos

import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    if (!tweetId) {
      throw new apiError(400, "Tweet id is required. !!");
    }
    // Check if the tweet exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
      throw new apiError(404, "Tweet not found. !!");
    }
    // Get the user ID from the request
    const userId = req.user?._id;
    if (!userId) {
      throw new apiError(401, "User is not authenticated. !!");
    }
    // Check if the user has already liked the tweet
    const like = await Like.findOne({ tweet:tweetId, likedBy: userId });
    console.log("like :",like);
    if (like) {
      // If the user has already liked the tweet, unlike it
      await Like.findByIdAndDelete(like._id);
      return res
        .status(200)
        .json(new apiResponse(200, {like}, "Tweet like toggled successfully."));
    } else {
      // If the user has not liked the tweet, like it
      const newLike = new Like({ tweet: tweetId, likedBy: userId });
      await newLike.save();
      return res
        .status(200)
        .json(new apiResponse(200, {newLike}, "Tweet like toggled successfully."));
    }
  } catch (error) {
    throw new apiError(400, "Failed to toggle tweet like.", error);
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  try {
    const likedVideos = await User.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.user._id), // here may be error
        },
      },
      {
        $lookup: {
          from: "Like",
          localField: "_id",
          foreignField: "likedBy",
          as: "likedVideos",
        },
      },
    ]);
    console.log("All liked videos :", likedVideos);

    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { likedVideos },
          "All liked videos fetched successfully."
        )
      );
  } catch (error) {
    throw new apiError(400, "Failed to fetch all liked videos. !!");
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

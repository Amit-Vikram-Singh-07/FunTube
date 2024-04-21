import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import  {asyncHandler}  from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like [total video views], [total subscribers],[total subscribedTo] [total videos], [total likes] etc.
  const channelId = req.user?._id;
  try {
    //   Channel all videos
    const channelVideos = await Video.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(channelId), // Match documents with the owner field equal to the user ID
        },
      },
      {
        $addFields: {
          channelViewsCount: {
            $sum: "$views", // Sum the viewsCount field of all videos
          },
        },
      },
    ]);
    console.log("Channel videos :", channelVideos);

    const channel = await User.aggregate([
      {
        $match: {
          username: req.user?._id,
        },
      },
      {
        $lookup: {
          from: "subscriptions", // from which doc's you want to search
          localField: "_id", // local field
          foreignField: "channel", // foreign field channel will give subscribers
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo", // to how many channel this user has benn subscribed
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "likedBy",
          as: "channelLikes", // to how many channel this user has benn subscribed
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          channelsLikesCount: {
            $size: "$channelLikes",
          },
        },
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscribersCount: 1,
          channelsLikesCount: 1,
          channelsSubscribedToCount: 1,
        },
      },
    ]);
    console.log("Channel :", channel);

    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { channelVideos, channel },
          "Channel stats retrieved successfully."
        )
      );
  } catch (error) {
    throw new apiError(500, "Channel stats did't fetched successfully. !!");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const channelId = req.user?._id;
    const channelVideos = await Video.aggregate([
      {
        $match: {
          owner: mongoose.Types.ObjectId(channelId), // Match documents with the owner field equal to the user ID
        },
      },
    ]);
    console.log("Channel videos :", channelVideos);
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { channelVideos },
          "Channel videos retrieved successfully."
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(new apiError(500, "Failed to retrieve channel videos."));
  }
});

export { getChannelStats, getChannelVideos };

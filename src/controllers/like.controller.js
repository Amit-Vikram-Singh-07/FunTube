import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// TODO:: you may check all videoId, commentId, tweetId etc. in respective model, for it's existance

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id. !!");
  }
  try {
    const alreadyLiked = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked) {
      // this is deleting the doc which may include the video likes or comment likes too
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            { isLiked: false },
            "Video like removed successfully."
          )
        );
    }
    // if not liked already doc found then create
    const likeVideo = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!likeVideo) {
      throw new apiError(500, "Server error while liking the video. !!");
    }

    return res
      .status(200)
      .json(new apiResponse(200, { likeVideo }, "Video liked successfully."));
  } catch (error) {
    throw new apiError(400, "Failed to toggle like on video. !!");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id. !!");
  }
  try {
    const alreadyLiked = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked) {
      // this is deleting the doc which may include the video likes or comment likes too
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            { isLiked: false },
            "Comment like removed successfully."
          )
        );
    }
    // if not liked already doc found then create
    const likeComment = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!likeComment) {
      throw new apiError(500, "Server error while liking the commrent. !!");
    }

    return res
      .status(200)
      .json(new apiResponse(200, likeComment, "Comment liked successfully."));
  } catch (error) {
    throw new apiError(400, "Failed to toggle like on comment. !!");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id. !!");
  }
  try {
    const alreadyLiked = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked) {
      // this is deleting the doc which may include the video likes or comment likes too
      await Like.findByIdAndDelete(alreadyLiked._id);
      return res
        .status(200)
        .json(
          new apiResponse(
            200,
            { isLiked: false },
            "Tweet like removed successfully."
          )
        );
    }
    // if not liked already doc found then create
    const likeTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!likeTweet) {
      throw new apiError(500, "Server error while liking the tweet. !!");
    }

    return res
      .status(200)
      .json(new apiResponse(200, likeTweet, "Tweet liked successfully."));
  } catch (error) {
    throw new apiError(400, "Failed to toggle like on tweet. !!");
  }
});

// const getLikedVideosNitesh = asyncHandler(async (req, res) => {
//   const userId = req.user?._id;

//   if (!isValidObjectId(userId)) {
//     throw new ApiError(400, "Invalid user Id");
//   }

//   const allLikedVideos = await Like.aggregate([
//     {
//       $match: {
//         likedBy: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "video",
//         foreignField: "_id",
//         as: "likedVideos",
//         pipeline: [
//           {
//             $lookup: {
//               from: "users",
//               localField: "owner",
//               foreignField: "_id",
//               as: "ownerDetails",
//             },
//           },
//           {
//             $unwind: "$ownerDetails",
//           },
//         ],
//       },
//     },
//     {
//       $unwind: "$likedVideos",
//     },
//     {
//       $sort: {
//         createdAt: -1,
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         likedVideos: {
//           _id: 1,
//           "videoFile.url": 1,
//           "thumbnail.url": 1,
//           owner: 1,
//           title: 1,
//           description: 1,
//           views: 1,
//           duration: 1,
//           createdAt: 1,
//           isPublished: 1,
//           ownerDetails: {
//             username: 1,
//             fullName: 1,
//             "avatar.url": 1,
//           },
//         },
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, allLikedVideos, "Liked Videos fetched successfully")
//     );
// });

const getLikedVideos = asyncHandler(async (req, res) => {
  try {
    // Get the user ID from the request
    const userId = req.user?._id;
    // Ensure user ID is valid
    if (!isValidObjectId(userId)) {
      throw new apiError(400, "Invalid user ID. !!");
    }
    // Find all liked videos by the user
    const likedVideos = await Like.find({ likedBy: userId }).populate("video");
    // Respond with the liked videos
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { likedVideos },
          "Liked videos retrieved successfully."
        )
      );
  } catch (error) {
    throw new apiError(500, "Failed to retrieve liked videos.", error);
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

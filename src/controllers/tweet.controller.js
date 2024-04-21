import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    try {
        const { tweet } = req.body;
        if (!tweet) {
            throw new apiError(400, "Tweet is required. !!");
        }
        const createdTweet = await Tweet.create({
            tweet: tweet,
            owner: req.user._id,
        });
        if (!createdTweet) {
            throw new apiError(500, "Error while creating your tweet. !!");
        }
        res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    { "createdTweet :": createdTweet },
                    "Tweet added/created successfully."
                )
            );
    } catch (error) {
        throw new apiError(400, "Failed to add/create your tweet.", error);
    }
});
// Using Aggregation pipeline finding some more detailsa like user, likedcount etc.
// const getUserTweets = asyncHandler(async (req, res) => {
//     // Extract the userId from the request parameters
//     const { userId } = req.params;
  
//     // Check if the userId is a valid ObjectId
//     if (!isValidObjectId(userId)) {
//       throw new ApiError(400, "Invalid user Id");
//     }
  
//     // Find the user by userId
//     const user = await User.findById(userId);
  
//     // If user not found, throw a 404 error
//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }
  
//     // Aggregate pipeline to fetch all tweets of the user along with additional details
//     const allTweets = await Tweet.aggregate([
//       {
//         $match: {
//           owner: new mongoose.Types.ObjectId(userId),
//         },
//       },
//       {
//         // Lookup to fetch owner details (username and avatar)
//         $lookup: {
//           from: "users",
//           localField: "owner",
//           foreignField: "_id",
//           as: "ownerDetails",
//           pipeline: [
//             {
//               $project: {
//                 username: 1,
//                 "avatar.url": 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         // Lookup to fetch like details for each tweet
//         $lookup: {
//           from: "likes",
//           localField: "_id",
//           foreignField: "tweet",
//           as: "likeDetails",
//           pipeline: [
//             {
//               $project: {
//                 likedBy: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         // Add a field to calculate likes count for each tweet
//         $addFields: {
//           likesCount: {
//             $size: "$likeDetails",
//           },
//           ownerDetails: {
//             $first: "$ownerDetails",
//           },
//           // Check if the current user has liked each tweet
//           isLiked: {
//             $cond: {
//               if: {
//                 $in: [userId, "$ownerDetails.likedBy"],
//               },
//               then: true,
//               else: false,
//             },
//           },
//         },
//       },
//       {
//         // Sort the tweets by createdAt timestamp in descending order
//         $sort: {
//           createdAt: -1,
//         },
//       },
//       {
//         // Project only the required fields for the response
//         $project: {
//           content: 1,
//           ownerDetails: 1,
//           likesCount: 1,
//           createdAt: 1,
//           isLiked: 1,
//         },
//       },
//     ]);
  
//     // If no tweets found, throw a 500 error
//     if (!allTweets) {
//       throw new ApiError(500, "Error while getting all tweets");
//     }
  
//     // Return the fetched tweets in the response
//     return res
//       .status(200)
//       .json(new ApiResponse(200, allTweets, "All tweets fetched successfully"));
//   });
  

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: Get user tweets
    try {
        const { userId } = req.params;
        if (!userId) {
            throw new apiError(400, "User id is required. !!");
        }
        if (!isValidObjectId(userId)) {
            throw new apiError(400, "Invalid user id. !!");
        }
        const tweets = await Tweet.find({ owner: userId });
        if(!tweets){
            throw new apiError(500, "Error occoured while retrieving the all tweets. !!", error);
        }
        console.log("All tweets :",tweets);
        res
            .status(200)
            .json(new apiResponse(200, { "All tweets : ": tweets }, "User tweets retrieved successfully."));
    } catch (error) {
        throw new apiError(400, "Failed to retrieve user tweets.", error);
    }
});

const updateTweet = asyncHandler(async (req, res) => {
    // TODO: Update a tweet
    try {
        const { tweetId } = req.params;
        const { newTweet } = req.body;
        if (!tweetId) {
            throw new apiError(400, "Tweet id is required. !!");
        }
        if (!newTweet) {
            throw new apiError(400, "New tweet content is required. !!");
        }
        if (!isValidObjectId(tweetId)) {
            throw new apiError(400, "Invalid tweet id. !!");
        }
        const tweetToUpdate = await Tweet.findById(tweetId);
        if (!tweetToUpdate) {
            throw new apiError(404, "Tweet not found. !!");
        }
        // Check if the authenticated user is the owner of the tweet
        if (tweetToUpdate.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(
                403,
                "You are not authorized to update this tweet. !!"
            );
        }
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            { $set: { tweet: newTweet } },
            { new: true }
        );
        if (!updatedTweet) {
            throw new apiError(500, "Error occoured while updating tweet. !!");
        }
        res
            .status(200)
            .json(
                new apiResponse(200, { updatedTweet }, "Tweet updated successfully.")
            );
    } catch (error) {
        throw new apiError(400, "Failed to update tweet.", error);
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const { tweetId } = req.params;
        if (!tweetId) {
            throw new apiError(
                400,
                "Tweet id is required. or Unauthorized request!!"
            );
        }
        if (!isValidObjectId(tweetId)) {
            throw new apiError(400, "Invalid tweet id. !!");
        }
        const tweet = await Tweet.findById(tweetId);
        if (!tweet) {
            throw new apiError(404, "Tweet  not found. !!");
        }
        if (tweet?.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(400, "Only owner can delete their tweet. !!");
        }
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
        if (!deletedTweet) {
            throw new apiError(500, "Server error while deleting the tweet");
        }
        res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    { "Deleted tweet :": deletedTweet },
                    "Tweet deleted successfully."
                )
            );
    } catch (error) {
        throw new apiError(400, "Failed to delete tweet. !!");
    }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

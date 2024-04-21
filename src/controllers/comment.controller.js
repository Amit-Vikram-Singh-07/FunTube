import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Do lookup from Video to Comment
    const videoComments = await Video.aggregate([
      {
        $match: videoId,
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "video",
          as: "videoComments",
        },
      },
      {
        $addFields: {
          videoComments: "$videoComments",
        },
      },
    ]);

    // Respond with video comments
    res
      .status(200)
      .json(
        new apiResponse(
          200,
          { videoComments },
          "Retrieved video comments successfully."
        )
      );
  } catch (error) {
    // Handle errors
    res
      .status(error.statusCode || 500)
      .json(
        new apiError(
          error.statusCode || 500,
          error.message || "Failed to retrieve video comments.",
          error.details || error
        )
      );
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    //   Destructuring the required data
    const videoId = req.params;
    const { newComment } = req.body;
    const userId = req.user?._id;
    // Check for required data
    if (!videoId || !newComment || !userId) {
      throw new apiError(400, "Invalid request. Missing required data. !!");
    }
    // Create a new comment document
    const comment = {
      newComment,
      userId,
      videoId,
    };
    // Save the new comment to the database
    await comment.save();
    res
      .status(200)
      .json(new apiResponse(200, { comment }, "Comment added successfully."));
  } catch (error) {
    // Handle errors
    res.status(500).json(new apiError(500, "Failed to add comment. !!", error));
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    //   Destructing the requiered data
    const commentId = req.params;
    const newComment = req.body;
    // Check if required data is provided
    if (!commentId || !newComment) {
      throw new apiError(400, "Invalid request. Missing required data. !!");
    }
    // Find the comment by its ID and update it
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { comment: newComment } },
      { new: true }
    );
    if (!updateComment) {
      throw new apiError(404, "Updated comment not found. !!");
    }
    res
      .status(200)
      .json(
        200,
        { "updatedComment : ": updatedComment },
        "Comment updated successfully."
      );
  } catch (error) {
    throw new apiError(
      error.statusCode || 500,
      "Failed to update comment.",
      error
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    // Destructure the required data
    const { commentId } = req.params;

    // Check if required data is provided
    if (!commentId) {
      throw new apiError(400, "Invalid request. Missing required data.");
    }

    // Find the comment by its ID and delete it
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    console.log("Deleted comment :", deleteComment);
    // Check if the comment was found and deleted
    if (!deletedComment) {
      throw new apiError(404, "Comment not found. !!");
    }

    // Respond with success message
    res
      .status(200)
      .json(new apiResponse(200, null, "Comment deleted successfully."));
  } catch (error) {
    // Handle errors
    res
      .status(error.statusCode || 500)
      .json(
        new apiError(
          error.statusCode || 500,
          error.message || "Failed to delete comment. !!",
          error.details || error
        )
      );
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };

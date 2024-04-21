import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        // Check if the user is authenticated
        const userId = req.user?._id;
        if (!userId) {
            throw new apiError(401, "User is not authenticated.");
        }
        // Validate the channelId
        const { channelId } = req.params;
        const channelExist = await User.findById(channelId);
        if (!channelExist) {
            throw new apiError(400, "Channel does not exist. !!");
        }
        if (!isValidObjectId(channelId)) {
            throw new apiError(400, "Invalid channel Id.");
        }
        // Find the subscription document for the channel
        let channelSubscriptionDoc = await Subscription.findById(channelId);

        // If subscription document doesn't exist, create a new one
        if (!channelSubscriptionDoc) {
            channelSubscriptionDoc = new Subscription({
                channel: channelId,
                subscribers: [],
            });
        }
        // Check if the user is already subscribed
        const isSubscribed = channelSubscriptionDoc.subscribers.includes(userId);

        // Toggle the subscription status
        if (isSubscribed) {
            // Unsubscribe the user
            channelSubscriptionDoc.subscribers = channelSubscriptionDoc.subscribers.filter((subscriberId) => subscriberId !== userId);
            await channelSubscriptionDoc.save({ validateBeforeSave: false });
            res
                .status(200)
                .json(new apiResponse(200, { channelSubscriptionDoc }, `Unsubscribed successfully for ${channelId}.`));
        } else {
            // Subscribe the user
            channelSubscriptionDoc.subscribers.push(userId);
            await channelSubscriptionDoc.save({ validateBeforeSave: false });
            res
                .status(200)
                .json(new apiResponse(200, { channelSubscriptionDoc }, `Subscribed successfully for ${channelId}.`));
        }
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Failed to toggle subscription.",
            error
        );
    }
});

// controller to return subscriber list of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        if (!isValidObjectId(channelId)) {
            throw new apiError(400, "Invalid channel Id");
        }
        const channelSubscriptionDoc = await Subscription.findById(channelId);
        if (!channelSubscriptionDoc) {
            throw new apiError(400, "Channel not found. !!");
        }
        console.log("Channel subscription document :", channelSubscriptionDoc);
        // Extract subscriber IDs from the subscription documents
        const subscriberIdArray = channelSubscriptionDoc.subscriber;
        console.log("Subscriber array : ", subscriberIdArray);
        //  const subscribers = channelSubscriptions.map(subscription => subscription.subscriber);

        res
            .status(200)
            .json(
                new apiResponse(
                    200,
                    { "Subscriber Id Array :": subscriberIdArray },
                    "Subscriber's fetched successfully."
                )
            );
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Failed to fetch channel subscribers.",
            error
        );
    }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const channelSubscribedTo = await User.aggregate([
            {
                $match: {
                    username: userId?.toLowerCase(),
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
        ]);
        if (!channelSubscribedTo?.length) {
            throw new apiError(404, "No channel is subscribed till now. !!.");
        }
        console.log("Channel's subscribed by you : ", channelSubscribedTo);
        return res
            .status(200)
            .json(new apiResponse(200, channelSubscribedTo, "User's subscribed channel fetched successfully."));
    } catch (error) {
        throw new apiError(400, "Failed to fetched all subscribed channels. !!");
    }
});

// Using populate method
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//     try {
//         const { userId } = req.params;
        
//         // Find the user by their ID
//         const user = await User.findOne({ username: userId?.toLowerCase() });
//         if (!user) {
//             return res.status(404).json(new apiResponse(404, null, "User not found."));
//         }

//         // Find all subscriptions where the user is a subscriber
//         const subscriptions = await Subscription.find({ subscriber: user._id }).populate('channel');

//         if (!subscriptions.length) {
//             return res.status(404).json(new apiResponse(404, null, "No channels are subscribed to by this user."));
//         }

//         // Extract the channels from the subscriptions
//         const subscribedChannels = subscriptions.map(subscription => subscription.channel);

//         return res.status(200).json(new apiResponse(200, subscribedChannels, "User's subscribed channels fetched successfully."));
//     } catch (error) {
//         throw new apiError(400, "Failed to fetch all subscribed channels.");
//     }
// });


export { toggleSubscription, getChannelSubscribers, getSubscribedChannels };

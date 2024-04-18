import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

//  Generating the both tokens
const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError(404, "User does not exist!.");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // validateBeforeSave -> for avoiding the all fields (required will create problem) input checking
    // console.log("User : ",user);

    return { accessToken, refreshToken };
  } catch (error) {
    // console.log("I am in catch block!.")
    throw new apiError(
      500,
      "While generating tokens, something went wrong!!. "
    );
  }
};

// Register a new user -> Steps involved
//Step 1 : Taking name, email from request/frontend
//Step 2 : Validation - like non empty field
//Step 3 : Checking user exist or not -> through email or username
//Step 4 : Check for image, avtar -> upload to cloudinary
//Step 5 : Creating new user to MOngodb with (name, email from request/frontend) -> checking creation successful or not
//Step 6 : Response from use creation -> remove password and refreshToken field
//Step 7 : return response

const registerUser = asyncHandler(async (req, res) => {
  // console.log("01 - I am here now, just at post-01!!");
  // Step 1: Extracting user data from request
  const { username, email, fullName, password, avatar, coverImg } = req.body;
  // console.log("Email :",email);
  // console.log(req.body);

  // Step 2: Validation - Checking for non-empty fields
  if (
    username == "" ||
    email == "" ||
    fullName == "" ||
    password == "" ||
    avatar == ""
  ) {
    throw new apiError(
      400,
      "All fields(username,email,fullName,password and avatar) are required."
    );
  }
  // Step 2: Validation - Checking for non-empty fields Optimized one
  // if (![username, email, fullName, password, avatar].some((field) => !field)) {
  //   throw new apiError(400, "All fields are required.");
  // }

  // Step 3: Checking if the user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new apiError(409, "User with email or username already exists.");
  }

  // Step 4: Check for coverImgLocalpath and avatarLocalpath, then upload to Cloudinary
  console.log("Files (req.files) to be uploaded : ", req.files);
  const avatarLocalpath = req.files?.avatar[0]?.path;
  // const coverImgLocalpath = req.files?.coverImg[0]?.path;
  let coverImgLocalpath;
  if (
    req.files &&
    req.files.coverImg &&
    req.files.coverImg[0] & req.files.coverImg[0].path
  ) {
    coverImgLocalpath = req.files.coverImg[0].path;
  }

  if (!avatarLocalpath) {
    throw new apiError(400, "Avatar field is required to local server.");
  }
  const avatarCloudResponse = await uploadToCloudinary(avatarLocalpath);
  const coverImgCloudResponse = await uploadToCloudinary(coverImgLocalpath);
  if (!avatarCloudResponse)
    throw new apiError(500, "Avatar field is required to cloudinary.");

  // console.log("avatarCloudResponse: ", avatarCloudResponse);
  // console.log("coverImgCloudResponse: ", coverImgCloudResponse);

  // Step 5: Creating a new user instance and checking created or not
  const newUser = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarCloudResponse.url,
    coverImg: coverImgCloudResponse?.url || "",
  });
  // Step :6 Check if user was successfully created && removing sensitive fields
  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(500, "Failed to create user.");
  }

  // console.log("02 - I am here now, just at post-02!!");
  // Step 7: Return success response
  res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully."));
});

// Login a user -> Steps involved
// Step 1: Destructuring the { email, password } from req.body
// Step 2: Validation - Check if email and password are provided
// Step 3: Check if the user is already logged in (optional)
// Step 4: Check if the user exists in the database
// Step 5: Compare the provided password with the stored password hash
// Step 6: If passwords match, generate a JWT token for authentication
// Step 7: Return the JWT token and any additional user data as a response

const loginUser = asyncHandler(async (req, res) => {
  // Step 1: Destructuring the { email, password } from req.body
  const { email, username, password } = req.body;

  // Step 2: Validation - Check if email and password are provided
  if ((!email && !username) || !password) {
    throw new apiError(400, "Email or Usernname and Password required!.");
  }
  // Step 3: Check if the user is already logged in (optional)
  // Step 4: Check if the user exists in the database
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new apiError(404, "User does not exist!.");
  }
  // Step 5: Compare the provided password with the stored password hash
  const isPasswordMatched = await user.isPasswordCorrect(password); // this method can be accessed by each user doc.
  if (!isPasswordMatched) {
    throw new apiError(400, "Password is incorrect! or Invalid credentials.");
  }
  // Step 6: If passwords match, generate a JWT token for authentication
  const { accessToken, refreshToken } = await generateAccessRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // console.log("Logged in user : ", loggedInUser);
  // console.log("01 ... I am herre!!!!.....");

  // Step 7: Return the JWT token and any additional user data as a response
  const options = {
    httpOnly: true,
    secure: true,
  };
  // console.log("02 ... I am herre!!!!.....");
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          // Why we need to send { refreshToken,accessToken} again in user object -> some user want to save cookie on client side
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User logged in successfully."
      )
    );
});

// Logout a user -> Steps involved
// Step 1: Get userId from request or session
// Step 2: Check if user exists in the database
// Step 3: Delete user's session or authentication token from the database
// Step 4: Send a success response indicating the user has been logged out

const logoutUser = asyncHandler(async (req, res) => {
  // Step 1: Get userId from request or session
  const userId = req.user._id;
  console.log("**** 01 - logoutUser post!! *****");
  // Step 2: Check if user exists in the database
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  console.log("***** 02 - logoutUser post!! ***** ");
  // const user = User.findById(userId);
  // if (!user) {
  //   throw new apiError(404, "User does not exist!.");
  // }
  // // Step 3: Delete user's session or authentication token from the database
  // user.refreshToken = "";
  // user.save();

  // Step 4: Send a success response indicating the user has been logged out
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully."));
});

// API End point for refreshing the access and refresh token
// Steps : 1) Extract the refresh token from the request cookies.
// Steps : 2) Verify the refresh token using the `jwt.verify` method.
// Steps : 3) Retrieve the user associated with the refresh token from the database.
// Steps : 4) Generate a new access token using the `jwt.sign` method.
// Steps : 5) Send the new access token as a JSON response.
// Steps : 6) If any error occurs during the process, send a 401 Unauthorized response.

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Steps : 1) Extract the refresh token from the request cookies.
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log("incomingRefreshToken : ", incomingRefreshToken);
  if (!incomingRefreshToken) {
    throw new apiError(
      401,
      "Unauthorized request!!, you don't have valid refreshToken."
    );
  }
  try {
    // Steps : 2) Verify the refresh token using the `jwt.verify` method.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded token :", decodedToken);

    // Steps : 3) Retrieve the user associated with the refresh token from the database.
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token, user does not exist!!");
    }
    // Steps : ) Matching the incomingRefreshToken and user saved refreshToken
    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used.");
    }
    // Steps : 4) Generate a new access token using the `jwt.sign` method.
    const { newAccessToken, newRefreshToken } =
      await generateAccessRefreshTokens(decodedToken._id);

    const options = {
      httpOnly: true,
      secure: true,
    };
    // console.log("02 ... I am herre!!!!.....");
    // Steps : 5) Send the new access token as a JSON response.
    res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            newRefreshToken,
            newAccessToken,
          },
          "User accessToken is refreshed successfully."
        )
      );
  } catch (error) {
    throw new apiError(
      401,
      "Unauthorized request, you should have refresh token!!"
    );
  }
});

// Steps involved in changing current password
// Steps : 1) Destructure {email,password,newPassword} from req.body
// Steps : 2) Validation check on {email,password,newPassword}
// Steps : 3) Check user exist or not then access that user
// Steps : 4) Match password with encrypted saved one, if matched then update  with newPassword
// Steps : 5) Send one response

// Change Password
const changePassword = asyncHandler(async (req, res) => {
  // Step 1: Destructure {email, password, newPassword} from req.body
  const { email, password, newPassword } = req.body;

  // Step 2: Validation
  if (!email || !password || !newPassword) {
    throw new apiError(
      400,
      "Email, current password, and new password are required."
    );
  }

  // Step 3: Check if the user exists and retrieve user data
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User not found.");
  }

  // Step 4: Match current password with the saved one, and update with newPassword if matched
  const isPasswordMatched = await user.isPasswordCorrect(password);
  if (!isPasswordMatched) {
    throw new apiError(400, "Invalid current password.");
  }
  user.password = newPassword;

  // Step 5: Save the updated user data
  await user.save({ validateBeforeSave: false });

  // Step 6: Send the response
  res
    .status(200)
    .json(new apiResponse(200, { user }, "Password changed successfully."));
});

// Steps involved in accessing current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const currUser = req.user;
  // console.log("Current user : ", currUser);
  res
    .status(200)
    .json(
      new apiResponse(200, { currUser }, "Current user fetched successfully..")
    );
});

// Steps involved updating the account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!email || !fullName) {
    throw new apiError(400, "All fields are required!.");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName: fullName, email: email },
    },
    { new: true } // for returning the updated user
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, { user }, "User account updated successfully."));
});

// Steps involved in user avatar updatation --> two middlewares in route verifyJWT,multer
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalpath = req.file?.path; // bcz here we accepting just one file not files
  if (!avatarLocalpath) {
    throw new apiError(
      400,
      "New avatar file is required to upload on local server."
    );
  }
  const avatarCloudResponse = await uploadToCloudinary(avatarLocalpath);
  if (!avatarCloudResponse) {
    throw new apiError(
      500,
      "New avatar file is required to upload on cloudinary."
    );
  }
  console.log("avatarCloudResponse: ", avatarCloudResponse);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatarCloudResponse.url },
    },
    { new: true } // for returning the updated user
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, user, "User's avatar is updated successfully."));
});

// Steps involved in user avatar updatation --> two middlewares in route verifyJWT,multer
const updateUserCoverImg = asyncHandler(async (req, res) => {
  const coverImgLocalpath = req.file?.path; // bcz here we are accepting just one file not files
  if (!coverImgLocalpath) {
    throw new apiError(
      400,
      "New cover image is required to upload on local server."
    );
  }
  const coverImgCloudResponse = await uploadToCloudinary(coverImgLocalpath);
  if (!coverImgCloudResponse) {
    throw new apiError(
      500,
      "New cover image is required to upload on cloudinary."
    );
  }
  console.log("coverImgCloudResponse: ", coverImgCloudResponse);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImg: coverImgCloudResponse.url },
    },
    { new: true } // for returning the updated user
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new apiResponse(200, user, "User's cover image is updated successfully.")
    );
});


const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
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
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
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
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
   console.log("Channel return by aggregte : " ,channel);
  if (!channel?.length) {
    throw new apiError(404, "Channel does not exists.");
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "User's channel fetched successfully.")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImg,
  getUserChannelProfile
};

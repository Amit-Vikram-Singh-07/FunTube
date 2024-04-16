import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";

// Register a new user -> Steps involved
//Step 1 : Taking name, email from request/frontend
//Step 2 : Validation - like non empty field
//Step 3 : Checking user exist or not -> through email or username
//Step 4 : Check for image, avtar -> upload to cloudinary
//Step 5 : Creating new user to MOngodb with (name, email from request/frontend) -> checking creation successful or not
//Step 6 : Response from use creation -> remove password and refreshToken field
//Step 7 : return response

const registerUser = asyncHandler(async (req, res) => {
  console.log("01 - I am here now, just at post-01!!");
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
    req.files.coverImg[0] &&
    req.files.coverImg[0].path
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

  console.log("avatarCloudResponse: ", avatarCloudResponse);
  console.log("coverImgCloudResponse: ", coverImgCloudResponse);

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

  console.log("02 - I am here now, just at post-02!!");
  // Step 7: Return success response
  res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered successfully."));
});

const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = User.findById(userId);
    if (!userId) {
      throw new apiError(404, "User does not exist!.");
    }
    const accessToken = user.generateaccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "While generating tokens, something went wrong!. ");
  }
};

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
  if ((email == "" && username == "") || password == "") {
    throw new apiError(400, "Email or Usernname and Password required!.");
  }
  // Step 3: Check if the user is already logged in (optional)

  // Step 4: Check if the user exists in the database
  const user = await User.findOne($or[({ email }, { username })]);
  if (!user) {
    throw new apiError(404, "User does not exist!.");
  }
  // Step 5: Compare the provided password with the stored password hash
  const isPasswordMatched = await user.isPasswordCorrect(password);
  if (!isPasswordMatched) {
    throw new apiError(400, "Password is incorrect!.");
  }
  // Step 6: If passwords match, generate a JWT token for authentication
  const { accessToken, refreshToken } = generateAccessRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Step 7: Return the JWT token and any additional user data as a response
  const options = {
    httpOnly: True,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
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

  // Step 2: Check if user exists in the database
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  // const user = User.findById(userId);
  // if (!user) {
  //   throw new apiError(404, "User does not exist!.");
  // }
  // // Step 3: Delete user's session or authentication token from the database
  // user.refreshToken = "";
  // user.save();

  // Step 4: Send a success response indicating the user has been logged out
  const options = {
    httpOnly: True,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, {}, "User logged out successfully."));
});

export{ registerUser,loginUser,logoutUser};

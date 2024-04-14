import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import uploadToCloudinary from "../utils/cloudinary.js";

// Register a new user -> Steps involved
//step 1 : Taking name, email from request/frontend
//step 2 : Validation - like non empty field
//step 3 : Checking user exist or not -> through email or username
//step 4 : Check for image, avtar -> upload to cloudinary
//step 5 : Creating new user to MOngodb with (name, email from request/frontend) -> checking creation successful or not
//step 6 : Response from use creation -> remove password and refreshToken field
//step 7 : return response

const registerUser = asyncHandler(async (req, res) => {
  console.log("01 - I am here now, just at post-01!!");
  // Step 1: Extracting user data from request
  const { username, email, fullName, password, avatar, coverImg } = req.body;
  // console.log("Email :",email);
  // console.log(req.body);

  // Step 2: Validation - Checking for non-empty fields
  if (username == "" || email == "" || fullName == "" || password == "" || avatar == "") {
    throw new apiError( 400, "All fields(username,email,fullName,password and avatar) are required.");
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
  if (req.files && req.files.coverImg && req.files.coverImg[0] && req.files.coverImg[0].path) {
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

export default registerUser; 

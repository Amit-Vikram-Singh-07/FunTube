import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  // 1. Extract the JWT token from the request headers or cookies
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Check if token exists
    if (!token) {
      throw new ApiError(401, "Unauthorized request!");
    }

    // 3. Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 4. Check if the user exists
    const user = await User.findById(decodedToken?._id).select("-password refreshToken");
    if (!user) {
        // Todo : next video discussion
      throw new ApiError(404, "User does not exist, invalid access token!");
    }

    // 5. Attach the user object to the request for further processing
    req.user = user;

    // 6. Call the next middleware
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token!");
  }
});

export { verifyJWT };

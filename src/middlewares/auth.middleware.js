import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";


// Steps involved in jwt authentication
// Steps: 1. Extract the JWT token from the request headers or cookies
// Steps: 2. Check if token exists
// Steps: 3. Verify the JWT token
// Steps: 4. Check if the user exists
// Steps: 5. Attach the user object to the request for further processing
// Steps: 6. Call the next middleware

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
      throw new apiError(401, "Unauthorized request!");
    }
    
    // 3. Verify the JWT token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("Decoded Token : ", decodedToken);
    // 4. Check if the user exists
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");// decodedToken?._id this can possible bcz we had added this info in payload
    // console.log("*** 01 - Inside jwtVerify ****");
    // console.log("User : ",user);
    // console.log("*** 02 - Inside jwtVerify ****");
    if (!user) {
      //******  Todo : next video discussion  ******//
      throw new apiError(404, "User does not exist, invalid access token!");
    }
    
    // 5. Attach the user object to the request for further processing
    req.user = user;
    
    // 6. Call the next middleware
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token!");
  }
});

export { verifyJWT };

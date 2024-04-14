import { mongoose, Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // for enabling better searching
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true, // for enabling better searching
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    avatar: {
      type: String, // cloudnary url for accessing the image or video
      required: true,
    },
    coverImg: {
      type: String, // cloudnary url for accessing the image or video
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password before saving to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // to ensure that, below will run whenever password get modified
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if the provided password matches the hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return await bcrypt.compare(password, this.password); // this.password is encrypted one
  } catch (error) {
    throw error;
  }
};

// Method to generate an access token for user authentication
userSchema.methods.generateAccessToken = function () {
  // Create a JWT access token with the specified payload
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

// Method to generate a refresh token for user authentication
userSchema.methods.generateRefreshToken = function () {
  // Create a JWT refresh token with the specified payload
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "10d" }
  );
};

export const User = mongoose.model("User", userSchema);

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload file to Cloudinary from local file path
const uploadToCloudinary = async (localFilePath) => {
  try {
    // Upload file to Cloudinary
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(response);
    console.log("File uploaded successfully uploaded.", response.url);
    return response;
  } catch (error) {
    try {
      // Remove the file from the local server
      fs.unlink(localFilePath);
      console.log(`File ${localFilePath} removed from local server.`);
    } catch (unlinkError) {
      console.error(
        `Error removing file ${localFilePath} from local server:`,
        unlinkError
      );
    }
    throw error;
  }
};

export default cloudinary;

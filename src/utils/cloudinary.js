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
    const cloudResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("File uploaded successfully uploaded.", cloudResponse.url);
    console.log("Cloudinary response after file upload :",cloudResponse);
    // fs.unlinkSync(localFilePath);
    // console.log(`File ${localFilePath} removed from local server.`);
    return cloudResponse;
  } catch (error) {
    try {
      // Remove the file from the local server
      fs.unlinkSync(localFilePath);
      console.log(`File ${localFilePath} removed from local server.`);
    } catch (unlinkError) {
      console.error(`Error removing file ${localFilePath} from local server:`,unlinkError);
    }
    throw error;
  }
};

export default uploadToCloudinary;

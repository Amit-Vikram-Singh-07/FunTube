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
    // console.log("Cloudinary response after file upload :", cloudResponse);
    // fs.unlinkSync(localFilePath);
    // console.log(`File ${localFilePath} removed from local server.`);
    return cloudResponse;
  } catch (error) {
    try {
      // Remove the file from the local server
      fs.unlinkSync(localFilePath);
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

// Function to delete an image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  // console.log("Image url :",imageUrl);
  try {
    // Extract public ID from the image URL (assuming Cloudinary public ID is part of the URL)
    const publicId = imageUrl.split("/").pop().split(".")[0];

    // Delete the image from Cloudinary
    const deletionResult = await cloudinary.uploader.destroy(publicId);
    // console.log("deletionResult :" ,deletionResult);

    if (deletionResult.result === "ok") {
      console.log(
        `Image with public ID ${publicId} deleted successfully from Cloudinary.`
      );
    } else {
      console.error(
        `Failed to delete image with public ID ${publicId} from Cloudinary.`
      );
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

export { uploadToCloudinary, deleteFromCloudinary };

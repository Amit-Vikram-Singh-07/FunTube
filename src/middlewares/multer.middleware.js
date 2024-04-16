import multer from "multer";


// Define storage configuration for Multer
const storage = multer.diskStorage({
  // Destination function specifies where files will be stored
  destination: (req, file, callback) => {
    // Specify the directory where files will be stored
    callback(null, "./public/temp");
  },
  // Filename function specifies how files should be named
  filename: (req, file, callback) => {
    // Specify the filename using the current timestamp and original filename -- each file will be unique
    callback(null, `${file.originalname}`); // for making it unique name ucan add &{Date.now()}
  },
});


// Define the upload middleware using Multer
const upload = multer({
  // Set storage to the disk storage configuration
  storage: storage,
  // Specify limits for uploaded files
  limits: {
    // Set the maximum file size to 10 MB
    // fileSize: 1024 * 1024 * 10, // 10 MB (in bytes)
  },
});

// Export the upload middleware for use in routes
export default upload;

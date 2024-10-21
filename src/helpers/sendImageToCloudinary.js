const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
const fs = require("fs");
const config = require("../config");

// Cloudinary configuration
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// Function to send image to Cloudinary
const sendImageToCloudinary = (imageName, path) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      path,
      { public_id: imageName },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);

        // Delete the file asynchronously after uploading to Cloudinary
        fs.unlink(path, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log("File deleted successfully");
          }
        });
      }
    );
  });
};

// Multer setup for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.cwd() + "/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// Multer middleware for uploading files
const upload = multer({ storage });

module.exports = { sendImageToCloudinary, upload };

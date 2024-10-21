const multer = require("multer");
const fs = require("fs");

const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = "";


      if (file.fieldname === "profile_image") {
        uploadPath = "uploads/images/profile";
      }
      else if (file.fieldname === "image") {
        uploadPath = "uploads/images/services";
      }
      else if (file.fieldname === "licensePlateImage") {
        uploadPath = "uploads/images/vehicle-licenses";
      } else if (file.fieldname === "drivingLicenseImage") {
        uploadPath = "uploads/images/driving-licenses";
      } else if (file.fieldname === "vehicleInsuranceImage") {
        uploadPath = "uploads/images/insurance";
      } else if (file.fieldname === "vehicleRegistrationCardImage") {
        uploadPath = "uploads/images/vehicle-registration";
      } else if (file.fieldname === "vehicleFrontImage") {
        uploadPath = "uploads/images/vehicle-image";
      } else if (file.fieldname === "vehicleBackImage") {
        uploadPath = "uploads/images/vehicle-image";
      } else if (file.fieldname === "vehicleSideImage") {
        uploadPath = "uploads/images/vehicle-image";
      } else {
        uploadPath = "uploads";
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "video/mp4"
      ) {
        cb(null, uploadPath);
      } else {
        cb(new Error("Invalid file type"));
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedFieldnames = [
      "profile_image",
      "licensePlateImage",
      "drivingLicenseImage",
      "vehicleInsuranceImage",
      "vehicleRegistrationCardImage",
      "vehicleFrontImage",
      "vehicleBackImage",
      "vehicleSideImage",
      "image"
    ];

    if (file.fieldname === undefined) {
      // Allow requests without any files
      cb(null, true);
    } else if (allowedFieldnames.includes(file.fieldname)) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
      }
    } else {
      cb(new Error("Invalid fieldname"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).fields([
    { name: "profile_image", maxCount: 1 },
    { name: "licensePlateImage", maxCount: 1 },
    { name: "drivingLicenseImage", maxCount: 1 },
    { name: "vehicleInsuranceImage", maxCount: 1 },
    { name: "vehicleRegistrationCardImage", maxCount: 1 },
    { name: "vehicleFrontImage", maxCount: 1 },
    { name: "vehicleBackImage", maxCount: 1 },
    { name: "vehicleSideImage", maxCount: 1 },
    { name: "image", maxCount: 10 },
  ]);

  return upload;
};

module.exports = { uploadFile };

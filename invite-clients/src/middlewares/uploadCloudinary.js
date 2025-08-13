const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folderName = "others";
    if (file.mimetype.startsWith("image/")) {
      folderName = "images";
    } else if (file.mimetype.startsWith("videos/")) {
      folderName = "videos";
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("msword") ||
      file.mimetype.includes("officedocument")
    ) {
      folderName = "docs";
    } else if (file.mimetype.startsWith("audio/")) {
      folderName = "audio";
    }
    return {
      folder: folderName,
      resource_type: "auto",
    };
  },
});
const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(
      new Error("Only image files are allowed for photo upload"),
      false
    );
  }

  cb(null, true);
};
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "photos",

    allowedFormats: ["jpg", "jpeg", "png", "webp"],
  },
});
const videoFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("video/")) {
    return cb(
      new Error("Only video files are allowed for video upload"),
      false
    );
  }

  cb(null, true);
};
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "videos",
    resource_type: "videos",
    allowedFormats: ["mp4", "mov", "avi", "mkv"],
  },
});
const docsFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only PDF, DOC, DOCX, and TXT files are allowed"),
      false
    );
  }

  cb(null, true);
};
const docsStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "documents",
    resource_type: "raw",
    allowedFormats: ["pdf", "doc", "docx", "txt"],
  },
});
//for genric
const uploadCloudinary = multer({ storage });
// for only images
const uploadPhotos = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
});
const uploadVideos = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
});
const uploadDocs = multer({
  storage: docsStorage,
  fileFilter: docsFileFilter,
});
const memoryUpload = multer({ storage: multer.memoryStorage() });
module.exports = {
  uploadCloudinary,
  uploadPhotos,
  uploadVideos,
  uploadDocs,
  memoryUpload,
};

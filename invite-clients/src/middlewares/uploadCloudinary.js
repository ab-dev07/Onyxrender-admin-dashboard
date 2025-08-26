const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folderName = "others";
    let resourceType = "auto";
    let publicId = undefined; // Let Cloudinary generate default ID

    if (file.mimetype.startsWith("image/")) {
      folderName = "images";
      resourceType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      folderName = "videos";
      resourceType = "video";
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("msword") ||
      file.mimetype.includes("officedocument") ||
      file.mimetype === "text/plain"
    ) {
      folderName = "docs";
      resourceType = "raw";
      // Add extension to public_id for documents to ensure proper URL
      const fileExtension = path.extname(file.originalname).toLowerCase();
      publicId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    } else if (file.mimetype.startsWith("audio/")) {
      folderName = "audio";
      resourceType = "auto";
    }

    const params = {
      folder: folderName,
      resource_type: resourceType,
    };

    // Only add public_id if we defined one (for documents)
    if (publicId) {
      params.public_id = publicId;
    }

    return params;
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
    resource_type: "video", // Fixed: was "videos", should be "video"
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

// Fixed document storage with proper extension handling
const docsStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // Extract file extension from original filename
    const fileExtension = path.extname(file.originalname).toLowerCase();

    return {
      folder: "documents",
      resource_type: "raw",
      // Include extension in public_id to ensure it appears in URL
      public_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`,
      // Don't use allowedFormats for raw files as it can cause issues
    };
  },
});

// Generic upload
const uploadCloudinary = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// For only images
const uploadPhotos = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
});

// For only videos
const uploadVideos = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
});

// For only documents
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
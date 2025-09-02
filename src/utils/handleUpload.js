const multer = require("multer");
const { sendResponse } = require("./standardResponse");

const hanldeUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return sendResponse(res, 400, `Multer Error:${err.message}`);
        }
        return sendResponse(res, 400, err.message || "File upload failed");
      }
      if (!req.file) {
        sendResponse(res, 400, "No file uploaded");
      }
      //if all good ,continue to next controller
      next();
    });
  };
};


// Chat upload middleware with 10 MB limit
const chatUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return sendResponse(res, 400, `Multer Error: ${err.message}`);
      }
      return sendResponse(res, 400, err.message || "File upload failed");
    }

    // pass file info to controller
    if (req.file) {
      console.log("FILE ", req.file);
      req.fileUrl = req.file.path; // cloudinary URL
      req.fileMime = req.file.mimetype;
    }

    next();
  });
};

module.exports = {
  hanldeUpload,
  chatUpload,
};




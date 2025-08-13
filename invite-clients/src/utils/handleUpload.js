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

module.exports = {
  hanldeUpload,
};

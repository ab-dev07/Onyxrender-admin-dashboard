// utils/response.util.js
// res ,statusCode ,message is imp to give
const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  const success = statusCode >= 200 && statusCode < 300;

  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    meta,
  });
};
module.exports = {
  sendResponse,
};

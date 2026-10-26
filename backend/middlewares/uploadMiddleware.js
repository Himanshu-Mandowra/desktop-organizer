const multer = require("multer");

// Max 20MB for static images and live wallpapers (.mp4, .webm, .gif, .png, .jpg, .webp)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (
    allowedMimes.includes(file.mimetype) ||
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload an image (PNG, JPG, WebP, GIF) or video (MP4, WebM) under 20MB."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { upload, MAX_FILE_SIZE };

// Cloudinary is OPTIONAL. Nothing here runs (and the `cloudinary` package is never loaded)
// until Cloudinary credentials are present in backend/.env.
//
// To switch uploads to Cloudinary, just add EITHER of these to backend/.env and run `npm install`:
//   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
//   -- or --
//   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// No code changes are needed. Without credentials, uploads are saved to backend/uploads/.

const hasPlaceholder = (v) => !v || v.startsWith("your_");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_URL ||
      (!hasPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
        !hasPlaceholder(process.env.CLOUDINARY_API_KEY) &&
        !hasPlaceholder(process.env.CLOUDINARY_API_SECRET))
  );

let cachedClient = null;

const getClient = () => {
  if (cachedClient) return cachedClient;
  let cloudinary;
  try {
    cloudinary = require("cloudinary").v2;
  } catch (err) {
    throw new Error(
      "Cloudinary credentials are set but the 'cloudinary' package is not installed. Run `npm install` in /backend."
    );
  }
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  cachedClient = cloudinary;
  return cloudinary;
};

const uploadBufferToCloudinary = (buffer, options = {}) => {
  const cloudinary = getClient();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "desktop-canvas",
        resource_type: "auto",
        ...options,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const destroyFromCloudinary = (publicId, resourceType = "image") =>
  getClient().uploader.destroy(publicId, { resource_type: resourceType });

module.exports = {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  destroyFromCloudinary,
};

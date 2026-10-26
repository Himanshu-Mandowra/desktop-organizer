const jwt = require("jsonwebtoken");
const User = require("../modules/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        requiresAuth: true,
        message: "Please sign up or log in to save layouts or like templates.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "desktop_canvas_fallback_secret"
    );

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        requiresAuth: true,
        message: "User account not found. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      requiresAuth: true,
      message: "Session expired or invalid token. Please log in.",
    });
  }
};

module.exports = { protect };

const fs = require("fs");
const path = require("path");
const Template = require("../modules/Template");
const User = require("../modules/User");
const {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} = require("../config/cloudinary");

// Built-in default templates (Boa Hancock as default + Toji Fushiguro)
const BUILT_IN_TEMPLATES = [
  {
    _id: "builtin-boa-hancock",
    title: "Boa Hancock",
    category: "One Piece",
    type: "image",
    url: "/templates/boa-hancock.jpg",
    mimeType: "image/jpeg",
    width: 1024,
    height: 576,
    isDefault: true,
    isBuiltIn: true,
    likesCount: 0,
  },
  {
    _id: "builtin-toji",
    title: "Toji Fushiguro",
    category: "Jujutsu Kaisen",
    type: "image",
    url: "/templates/toji.jpg",
    mimeType: "image/jpeg",
    width: 1024,
    height: 576,
    isDefault: false,
    isBuiltIn: true,
    likesCount: 0,
  },
];

// Seed built-in templates into MongoDB if not already present
const ensureBuiltInTemplatesSeeded = async () => {
  // Also migrate any previously seeded "Luffy" built-in entry to "Toji Fushiguro"
  await Template.updateMany(
    { title: "Luffy", isBuiltIn: true },
    {
      $set: {
        title: "Toji Fushiguro",
        category: "Jujutsu Kaisen",
        url: "/templates/toji.jpg",
      },
    }
  );

  for (const tpl of BUILT_IN_TEMPLATES) {
    const existing = await Template.findOne({
      title: tpl.title,
      isBuiltIn: true,
    });
    if (!existing) {
      await Template.create({
        title: tpl.title,
        category: tpl.category,
        type: tpl.type,
        url: tpl.url,
        mimeType: tpl.mimeType,
        width: tpl.width,
        height: tpl.height,
        isDefault: tpl.isDefault,
        isBuiltIn: true,
      });
    }
  }
};

// GET /api/templates (Public)
const getTemplates = async (req, res, next) => {
  try {
    await ensureBuiltInTemplatesSeeded();
    const templates = await Template.find().sort({
      isDefault: -1,
      isBuiltIn: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    // Fallback to built-in templates if DB is unavailable
    res.json({
      success: true,
      templates: BUILT_IN_TEMPLATES,
    });
  }
};

// POST /api/templates (Protected - Upload static or live wallpaper template <= 20MB)
const createTemplate = async (req, res, next) => {
  try {
    const { title, category, type } = req.body;
    const file = req.file;

    if (!file && !req.body.url) {
      return res.status(400).json({
        success: false,
        message: "Please provide a wallpaper file (up to 20MB) or media URL.",
      });
    }

    let mediaUrl = req.body.url || "";
    let publicId = "";
    let width = 1920;
    let height = 1080;
    const isVideoOrGif =
      file?.mimetype?.startsWith("video/") ||
      file?.mimetype === "image/gif" ||
      type === "live";
    const resolvedType = isVideoOrGif ? "live" : "image";

    if (file) {
      if (isCloudinaryConfigured()) {
        const result = await uploadBufferToCloudinary(file.buffer, {
          resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
        });
        mediaUrl = result.secure_url;
        publicId = result.public_id;
        width = result.width || 1920;
        height = result.height || 1080;
      } else {
        // Fallback to local backend/uploads if Cloudinary env variables aren't set yet
        const uploadsDir = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext =
          path.extname(file.originalname) || (isVideoOrGif ? ".mp4" : ".jpg");
        const safeFilename = `tpl_${Date.now()}_${Math.round(
          Math.random() * 1e6
        )}${ext}`;
        fs.writeFileSync(path.join(uploadsDir, safeFilename), file.buffer);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        mediaUrl = `${baseUrl}/uploads/${safeFilename}`;
      }
    }

    const template = await Template.create({
      title:
        title || (file ? path.parse(file.originalname).name : "Custom Template"),
      category:
        category || (resolvedType === "live" ? "Live Wallpaper" : "Custom"),
      type: resolvedType,
      url: mediaUrl,
      publicId,
      mimeType:
        file?.mimetype || (resolvedType === "live" ? "video/mp4" : "image/jpeg"),
      sizeBytes: file?.size || 0,
      width,
      height,
      isDefault: false,
      isBuiltIn: false,
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/templates/:id/like (Protected - Toggle like on template)
const toggleLikeTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    await ensureBuiltInTemplatesSeeded();

    let template = null;
    if (id.startsWith("builtin-")) {
      const targetTitle =
        id === "builtin-boa-hancock" ? "Boa Hancock" : "Toji Fushiguro";
      template = await Template.findOne({ title: targetTitle, isBuiltIn: true });
    } else {
      template = await Template.findById(id);
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    const templateKey = String(template._id);
    const alreadyLiked = template.likedBy.some(
      (uid) => String(uid) === String(userId)
    );

    if (alreadyLiked) {
      template.likedBy = template.likedBy.filter(
        (uid) => String(uid) !== String(userId)
      );
      template.likesCount = Math.max(0, template.likedBy.length);
      await User.findByIdAndUpdate(userId, {
        $pull: { likedTemplates: { $in: [templateKey, id] } },
      });
    } else {
      template.likedBy.push(userId);
      template.likesCount = template.likedBy.length;
      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedTemplates: templateKey },
      });
    }

    await template.save();
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: template.likesCount,
      likedTemplates: updatedUser.likedTemplates,
      template,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/templates/:id (Protected)
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found.",
      });
    }

    if (template.isBuiltIn) {
      return res.status(400).json({
        success: false,
        message: "Built-in templates cannot be deleted.",
      });
    }

    if (template.publicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(template.publicId, {
        resource_type: template.type === "live" ? "video" : "image",
      });
    }

    await template.deleteOne();

    res.json({
      success: true,
      message: "Template removed.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  toggleLikeTemplate,
  deleteTemplate,
};

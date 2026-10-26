const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a template title"],
      trim: true,
    },
    category: {
      type: String,
      default: "Anime",
      trim: true,
    },
    type: {
      type: String,
      enum: ["image", "live"],
      default: "image",
    },
    url: {
      type: String,
      required: [true, "Template media URL is required"],
    },
    publicId: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 1920,
    },
    height: {
      type: Number,
      default: 1080,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);

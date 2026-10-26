const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.Mixed, required: true },
    title: { type: String, default: "New Section" },
    color: { type: String, default: "#00ffff" },
    fillColor: { type: String, default: "rgba(15,15,15,0.35)" },
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 },
    width: { type: Number, default: 250 },
    height: { type: Number, default: 300 },
    shape: {
      type: String,
      enum: ["rect", "circle", "triangle", "polygon"],
      default: "rect",
    },
    sides: { type: Number, default: 4 },
    borderRadius: { type: Number, default: 24 },
    strokeWidth: { type: Number, default: 2 },
    imageUrl: { type: String, default: null },
    imageFit: {
      type: String,
      enum: ["cover", "contain", "stretch"],
      default: "cover",
    },
    imageScale: { type: Number, default: 1 },
    imageOffsetX: { type: Number, default: 0 },
    imageOffsetY: { type: Number, default: 0 },
  },
  { _id: false }
);

const layoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a layout name"],
      default: "My Desktop Layout",
      trim: true,
    },
    stageSize: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 },
    },
    gridConfig: {
      showGrid: { type: Boolean, default: true },
      mode: {
        type: String,
        enum: ["pc", "custom"],
        default: "pc",
      },
      customGridSize: { type: Number, default: 20 },
      pcCellWidth: { type: Number, default: 76 },
      pcCellHeight: { type: Number, default: 100 },
      showAppPreview: { type: Boolean, default: true },
    },
    wallpaper: {
      type: {
        type: String,
        enum: ["image", "live"],
        default: "image",
      },
      url: { type: String, default: "/templates/boa-hancock.jpg" },
      title: { type: String, default: "Boa Hancock" },
      templateId: { type: String, default: "builtin-boa-hancock" },
    },
    sections: [sectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Layout", layoutSchema);

const Layout = require("../modules/Layout");

// GET /api/layouts (Protected - Get all saved layouts for user)
const getUserLayouts = async (req, res, next) => {
  try {
    const layouts = await Layout.find({ user: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json({
      success: true,
      layouts,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/layouts (Protected - Save new or update existing layout)
const saveLayout = async (req, res, next) => {
  try {
    const { layoutId, name, stageSize, gridConfig, wallpaper, sections } =
      req.body;

    let layout;
    if (layoutId) {
      layout = await Layout.findOneAndUpdate(
        { _id: layoutId, user: req.user._id },
        {
          name: name || "My Desktop Layout",
          stageSize,
          gridConfig,
          wallpaper,
          sections,
        },
        { new: true, runValidators: true }
      );
    }

    if (!layout) {
      layout = await Layout.create({
        user: req.user._id,
        name: name || "My Desktop Layout",
        stageSize,
        gridConfig,
        wallpaper,
        sections,
      });
    }

    res.status(201).json({
      success: true,
      layout,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/layouts/:id (Protected)
const getLayoutById = async (req, res, next) => {
  try {
    const layout = await Layout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: "Layout not found.",
      });
    }

    res.json({
      success: true,
      layout,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/layouts/:id (Protected)
const deleteLayout = async (req, res, next) => {
  try {
    const layout = await Layout.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: "Layout not found.",
      });
    }

    res.json({
      success: true,
      message: "Layout deleted.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserLayouts,
  saveLayout,
  getLayoutById,
  deleteLayout,
};

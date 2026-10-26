const express = require("express");
const router = express.Router();
const {
  getUserLayouts,
  saveLayout,
  getLayoutById,
  deleteLayout,
} = require("../controllers/layoutController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getUserLayouts);
router.post("/", protect, saveLayout);
router.get("/:id", protect, getLayoutById);
router.delete("/:id", protect, deleteLayout);

module.exports = router;

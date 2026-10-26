const express = require("express");
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  toggleLikeTemplate,
  deleteTemplate,
} = require("../controllers/templateController");
const { protect } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

router.get("/", getTemplates);
router.post("/", protect, upload.single("file"), createTemplate);
router.post("/:id/like", protect, toggleLikeTemplate);
router.delete("/:id", protect, deleteTemplate);

module.exports = router;

const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/comic-view",
  authMiddleware,
  analyticsController.trackComicView
);

router.post(
  "/comic-read",
  authMiddleware,
  analyticsController.trackComicRead
);

module.exports = router;
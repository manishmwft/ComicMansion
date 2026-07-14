const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const downloadController = require("../controllers/downloadController");

router.get(
  "/check-access/:episode_id",
  authMiddleware,
  downloadController.checkDownloadAccess
);

module.exports = router;
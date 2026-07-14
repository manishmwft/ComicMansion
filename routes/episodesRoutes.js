const express = require("express");
const router = express.Router();

const { getEpisodes } = require("../controllers/episodesController");
const authMiddleware = require("../middleware/authMiddleware");

// GET /episodes/:comic_id
router.get("/:comic_id", authMiddleware, getEpisodes);

module.exports = router;
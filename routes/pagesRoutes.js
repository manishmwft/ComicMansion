const express = require("express");
const router = express.Router();

const { getPages } = require("../controllers/pagesController");
const authMiddleware = require("../middleware/authMiddleware");

// GET /pages/:episode_id
router.get("/:episode_id", authMiddleware, getPages );

module.exports = router;
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const favoriteController = require("../controllers/favoriteController");

// 🔐 All routes protected
router.use(authMiddleware);

// GET all favorites (returns comics)
router.get("/", favoriteController.getFavorites);

// ADD favorite
router.post("/", favoriteController.addFavorite);

// REMOVE favorite
router.delete("/:comic_id", favoriteController.removeFavorite);

module.exports = router;
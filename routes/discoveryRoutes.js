const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const discoveryController = require("../controllers/discoveryController");

router.get(
  "/trending",
  discoveryController.getTrendingComics
);
router.get(
  "/new-episodes",
  discoveryController.getNewEpisodes
);

router.get(
  "/genres",
  discoveryController.getGenres
);

router.get(
  "/genre/:genre",
  discoveryController.getComicsByGenre
);

router.get(
  "/recommended",
  authMiddleware,
  discoveryController.getRecommendedComics
);

router.get(
  "/home",
  authMiddleware,
  discoveryController.getHomeFeed
);

router.get(
  "/featured",
  discoveryController.getFeaturedComics
);
module.exports = router;

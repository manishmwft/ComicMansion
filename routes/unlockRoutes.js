const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  unlockEpisodeWithCoins,
  checkEpisodeAccess,
  getUnlockedEpisodes,
} = require('../controllers/unlockController');

router.post(
  '/episode',
  authMiddleware,
  unlockEpisodeWithCoins
);

router.get(
  '/episode/:episode_id/access',
  authMiddleware,
  checkEpisodeAccess
);

router.get(
  '/episodes',
  authMiddleware,
  getUnlockedEpisodes
);

module.exports = router;
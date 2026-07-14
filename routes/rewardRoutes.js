const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  getRewardsDashboard,
  claimDailyReward,
  dailyCheckin,
  addMissionProgress,
  claimMissionReward,
  getCoinTransactions,
} = require('../controllers/rewardController');

router.get(
  '/dashboard',
  authMiddleware,
  getRewardsDashboard
);

router.post(
  '/daily-reward',
  authMiddleware,
  claimDailyReward
);

router.post(
  '/checkin',
  authMiddleware,
  dailyCheckin
);

router.post(
  '/mission-progress',
  authMiddleware,
  addMissionProgress
);

router.post(
  '/missions/:progress_id/claim',
  authMiddleware,
  claimMissionReward
);

router.get(
  '/transactions',
  authMiddleware,
  getCoinTransactions
);

module.exports = router;
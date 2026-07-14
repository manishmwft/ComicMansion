const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const rewardedAdController = require("../controllers/rewardedAdController");

const {
  rewardedAdLimiter,
} = require("../middleware/rateLimiters");

router.get(
  "/status",
  authMiddleware,
  rewardedAdController.getRewardedAdStatus
);

router.post(
  "/claim",
  rewardedAdLimiter,
  authMiddleware,
  rewardedAdController.claimRewardedAd
);

module.exports = router;
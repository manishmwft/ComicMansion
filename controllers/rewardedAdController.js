const RewardedAd = require("../models/RewardedAd");
const RewardProfile = require("../models/RewardProfile");
const CoinTransaction = require("../models/CoinTransaction");

const DAILY_AD_LIMIT = 5;
const REWARD_COINS = 15;
const DAILY_BONUS_COINS = 50;
const COOLDOWN_MINUTES = 2;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

exports.getRewardedAdStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayKey();

    const watchedToday = await RewardedAd.countDocuments({
      user_id: userId,
      reward_date: today,
      status: "completed",
    });

    const lastAd = await RewardedAd.findOne({
      user_id: userId,
      status: "completed",
    }).sort({ completed_at: -1 });

    let cooldownRemainingSeconds = 0;

    if (lastAd) {
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
      const elapsed = Date.now() - new Date(lastAd.completed_at).getTime();

      if (elapsed < cooldownMs) {
        cooldownRemainingSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      }
    }

    return res.json({
      success: true,
      watched_today: watchedToday,
      daily_limit: DAILY_AD_LIMIT,
      remaining_ads: Math.max(DAILY_AD_LIMIT - watchedToday, 0),
      reward_coins: REWARD_COINS,
      daily_bonus_coins: DAILY_BONUS_COINS,
      cooldown_remaining_seconds: cooldownRemainingSeconds,
      can_watch:
        watchedToday < DAILY_AD_LIMIT && cooldownRemainingSeconds === 0,
    });
  } catch (error) {
    console.error("Rewarded ad status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rewarded ad status",
    });
  }
};

exports.claimRewardedAd = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayKey();

    const {
      ad_unit_id = "",
      device_id = "",
      session_id = "",
      platform = "unknown",
    } = req.body;

    const watchedToday = await RewardedAd.countDocuments({
      user_id: userId,
      reward_date: today,
      status: "completed",
    });

    if (watchedToday >= DAILY_AD_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Daily rewarded ad limit reached",
      });
    }

    const lastAd = await RewardedAd.findOne({
      user_id: userId,
      status: "completed",
    }).sort({ completed_at: -1 });

    if (lastAd) {
      const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
      const elapsed = Date.now() - new Date(lastAd.completed_at).getTime();

      if (elapsed < cooldownMs) {
        return res.status(429).json({
          success: false,
          message: "Please wait before watching another ad",
        });
      }
    }

    let rewardCoins = REWARD_COINS;
    let bonusCoins = 0;

    if (watchedToday + 1 === DAILY_AD_LIMIT) {
      bonusCoins = DAILY_BONUS_COINS;
      rewardCoins += bonusCoins;
    }

    let rewardProfile = await RewardProfile.findOne({
      user_id: userId,
    });

    if (!rewardProfile) {
      rewardProfile = await RewardProfile.create({
        user_id: userId,
        coins: 0,
        total_xp: 0,
        level: 1,
        streak_count: 0,
      });
    }

    rewardProfile.coins += rewardCoins;
    await rewardProfile.save();

    const transaction = await CoinTransaction.create({
      user_id: userId,
      amount: rewardCoins,
      type: "earn",
      source: "rewarded_ad",
      description:
        bonusCoins > 0
          ? `Rewarded ad + daily bonus earned ${rewardCoins} coins`
          : `Rewarded ad earned ${rewardCoins} coins`,
    });

    const rewardedAd = await RewardedAd.create({
      user_id: userId,
      ad_type: "coin_reward",
      reward_type: "coins",
      reward_coins: rewardCoins,
      ad_network: "admob",
      ad_unit_id,
      reward_transaction_id: transaction._id,
      device_id,
      session_id,
      platform,
      status: "completed",
      reward_date: today,
      completed_at: new Date(),
    });

    return res.json({
      success: true,
      message:
        bonusCoins > 0
          ? `You earned ${rewardCoins} coins including daily bonus!`
          : `You earned ${rewardCoins} coins!`,
      reward_coins: rewardCoins,
      bonus_coins: bonusCoins,
      watched_today: watchedToday + 1,
      daily_limit: DAILY_AD_LIMIT,
      remaining_ads: Math.max(DAILY_AD_LIMIT - (watchedToday + 1), 0),
      coins: rewardProfile.coins,
      rewarded_ad_id: rewardedAd._id,
    });
  } catch (error) {
    console.error("Rewarded ad claim error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to claim rewarded ad reward",
    });
  }
};
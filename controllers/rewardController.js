const RewardProfile = require('../models/RewardProfile');
const CoinTransaction = require('../models/CoinTransaction');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Mission = require('../models/Mission');
const UserMissionProgress = require('../models/UserMissionProgress');

function getUserId(req) {
  return String(req.user.id || req.user._id);
}

function calculateLevel(totalXp) {
  return Math.floor(totalXp / 250) + 1;
}

function xpForNextLevel(level) {
  return level * 250;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateProfile(userId) {
  let profile = await RewardProfile.findOne({ user_id: userId });

  if (!profile) {
    profile = await RewardProfile.create({
      user_id: userId,
    });
  }

  return profile;
}

async function addCoins({
  userId,
  amount,
  source,
  description,
}) {
  const profile = await getOrCreateProfile(userId);

  profile.coins += amount;
  await profile.save();

  await CoinTransaction.create({
    user_id: userId,
    amount,
    type: 'earn',
    source,
    description,
  });

  return profile;
}

async function addXp(userId, xpAmount) {
  const profile = await getOrCreateProfile(userId);

  profile.total_xp += xpAmount;
  profile.level = calculateLevel(profile.total_xp);

  await profile.save();

  return profile;
}

exports.getRewardsDashboard = async (req, res) => {
  try {
    const userId = getUserId(req);

    const profile = await getOrCreateProfile(userId);

    const badges = await Badge.find({ is_active: true }).sort({
      createdAt: 1,
    });

    const userBadges = await UserBadge.find({
      user_id: userId,
    }).populate('badge_id');

    const missions = await Mission.find({ is_active: true });

    const period = todayKey();

    const missionData = [];

    for (const mission of missions) {
      let progress = await UserMissionProgress.findOne({
        user_id: userId,
        mission_id: mission._id,
        period_key: period,
      });

      if (!progress) {
        progress = await UserMissionProgress.create({
          user_id: userId,
          mission_id: mission._id,
          period_key: period,
        });
      }

      missionData.push({
        mission,
        progress,
      });
    }

    res.json({
      success: true,
      profile: {
        level: profile.level,
        total_xp: profile.total_xp,
        xp_for_next_level: xpForNextLevel(profile.level),
        coins: profile.coins,
        streak_count: profile.streak_count,
      },
      badges,
      unlocked_badges: userBadges,
      missions: missionData,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load rewards dashboard',
    });
  }
};

exports.claimDailyReward = async (req, res) => {
  try {
    const userId = getUserId(req);

    const profile = await getOrCreateProfile(userId);

    const today = todayKey();

    const lastDaily = profile.last_daily_reward_date
      ? profile.last_daily_reward_date.toISOString().slice(0, 10)
      : null;

    if (lastDaily === today) {
      return res.status(400).json({
        success: false,
        message: 'Daily reward already claimed today',
      });
    }

    profile.last_daily_reward_date = new Date();
    profile.coins += 10;
    profile.total_xp += 25;
    profile.level = calculateLevel(profile.total_xp);

    await profile.save();

    await CoinTransaction.create({
      user_id: userId,
      amount: 10,
      type: 'earn',
      source: 'daily_reward',
      description: 'Daily reward claimed',
    });

    res.json({
      success: true,
      message: 'Daily reward claimed',
      reward: {
        coins: 10,
        xp: 25,
      },
      profile,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to claim daily reward',
    });
  }
};

exports.dailyCheckin = async (req, res) => {
  try {
    const userId = getUserId(req);

    const profile = await getOrCreateProfile(userId);

    const today = todayKey();

    const lastCheckin = profile.last_checkin_date
      ? profile.last_checkin_date.toISOString().slice(0, 10)
      : null;

    if (lastCheckin === today) {
      return res.json({
        success: true,
        message: 'Already checked in today',
        profile,
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    if (lastCheckin === yesterdayKey) {
      profile.streak_count += 1;
    } else {
      profile.streak_count = 1;
    }

    profile.last_checkin_date = new Date();
    profile.total_xp += 10;
    profile.level = calculateLevel(profile.total_xp);

    await profile.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      profile,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to check in',
    });
  }
};

exports.addMissionProgress = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { mission_type, amount = 1 } = req.body;

    const missions = await Mission.find({
      mission_type,
      is_active: true,
    });

    const period = todayKey();

    const updated = [];

    for (const mission of missions) {
      let progress = await UserMissionProgress.findOne({
        user_id: userId,
        mission_id: mission._id,
        period_key: period,
      });

      if (!progress) {
        progress = await UserMissionProgress.create({
          user_id: userId,
          mission_id: mission._id,
          period_key: period,
        });
      }

      if (!progress.is_completed) {
        progress.progress_count += amount;

        if (progress.progress_count >= mission.target_count) {
          progress.progress_count = mission.target_count;
          progress.is_completed = true;
        }

        await progress.save();
      }

      updated.push(progress);
    }

    res.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to update mission progress',
    });
  }
};

exports.claimMissionReward = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { progress_id } = req.params;

    const progress = await UserMissionProgress.findOne({
      _id: progress_id,
      user_id: userId,
    }).populate('mission_id');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Mission progress not found',
      });
    }

    if (!progress.is_completed) {
      return res.status(400).json({
        success: false,
        message: 'Mission not completed yet',
      });
    }

    if (progress.is_claimed) {
      return res.status(400).json({
        success: false,
        message: 'Reward already claimed',
      });
    }

    const mission = progress.mission_id;

    let profile = await addXp(userId, mission.reward_xp);

    if (mission.reward_coins > 0) {
      profile = await addCoins({
        userId,
        amount: mission.reward_coins,
        source: 'mission',
        description: `Mission reward: ${mission.title}`,
      });
    }

    progress.is_claimed = true;
    await progress.save();

    res.json({
      success: true,
      message: 'Mission reward claimed',
      reward: {
        xp: mission.reward_xp,
        coins: mission.reward_coins,
      },
      profile,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to claim mission reward',
    });
  }
};

exports.getCoinTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    const transactions = await CoinTransaction.find({
      user_id: userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load transactions',
    });
  }
};
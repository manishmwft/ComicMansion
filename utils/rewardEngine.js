const RewardProfile = require('../models/RewardProfile');
const CoinTransaction = require('../models/CoinTransaction');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Mission = require('../models/Mission');
const UserMissionProgress = require('../models/UserMissionProgress');

function calculateLevel(totalXp) {
  return Math.floor(totalXp / 250) + 1;
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

async function addXp(userId, xpAmount) {
  const profile = await getOrCreateProfile(userId);

  profile.total_xp += xpAmount;
  profile.level = calculateLevel(profile.total_xp);

  await profile.save();

  return profile;
}

async function addCoins(userId, amount, source, description) {
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

async function updateMissionProgress(userId, missionType, amount = 1) {
  const missions = await Mission.find({
    mission_type: missionType,
    is_active: true,
  });

  const period = todayKey();
  const completedMissions = [];

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
        completedMissions.push(mission);
      }

      await progress.save();
    }
  }

  return completedMissions;
}

async function getUserStats(userId) {
  const ReadingProgress = require('../models/ReadingProgress');

  const completedEpisodes = await ReadingProgress.countDocuments({
    user_id: userId,
    is_completed: true,
  });

  const profile = await getOrCreateProfile(userId);

  return {
    completedEpisodes,
    streakCount: profile.streak_count,
    totalCoins: profile.coins,
    level: profile.level,
  };
}

async function checkAndUnlockBadges(userId) {
  const profile = await getOrCreateProfile(userId);
  const stats = await getUserStats(userId);

  const badges = await Badge.find({ is_active: true });
  const unlockedBadges = [];

  for (const badge of badges) {
    const alreadyUnlocked = await UserBadge.findOne({
      user_id: userId,
      badge_id: badge._id,
    });

    if (alreadyUnlocked) continue;

    let unlocked = false;

    if (
      badge.requirement_type === 'episodes_read' &&
      stats.completedEpisodes >= badge.requirement_value
    ) {
      unlocked = true;
    }

    if (
      badge.requirement_type === 'streak' &&
      stats.streakCount >= badge.requirement_value
    ) {
      unlocked = true;
    }

    if (
      badge.requirement_type === 'coins_earned' &&
      stats.totalCoins >= badge.requirement_value
    ) {
      unlocked = true;
    }

    if (
      badge.requirement_type === 'level' &&
      stats.level >= badge.requirement_value
    ) {
      unlocked = true;
    }

    if (unlocked) {
      await UserBadge.create({
        user_id: userId,
        badge_id: badge._id,
      });

      if (badge.reward_xp > 0) {
        profile.total_xp += badge.reward_xp;
      }

      if (badge.reward_coins > 0) {
        profile.coins += badge.reward_coins;

        await CoinTransaction.create({
          user_id: userId,
          amount: badge.reward_coins,
          type: 'earn',
          source: 'badge',
          description: `Badge reward: ${badge.name}`,
        });
      }

      profile.level = calculateLevel(profile.total_xp);
      await profile.save();

      unlockedBadges.push(badge);
    }
  }

  return unlockedBadges;
}

async function handleEpisodeCompleted(userId) {
  const xpReward = 20;
  const coinReward = 5;

  const profile = await addXp(userId, xpReward);

  await addCoins(
    userId,
    coinReward,
    'mission',
    'Episode completed reward'
  );

  const completedDailyMissions = await updateMissionProgress(
    userId,
    'read_episode',
    1
  );

  const completedMarathonMissions = await updateMissionProgress(
    userId,
    'read_multiple',
    1
  );

  const unlockedBadges = await checkAndUnlockBadges(userId);

  return {
    xpReward,
    coinReward,
    completedMissions: [
      ...completedDailyMissions,
      ...completedMarathonMissions,
    ],
    unlockedBadges,
    profile,
  };
}

module.exports = {
  handleEpisodeCompleted,
  updateMissionProgress,
  checkAndUnlockBadges,
};
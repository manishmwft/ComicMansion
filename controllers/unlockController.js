const EpisodeUnlock = require('../models/EpisodeUnlock');
const RewardProfile = require('../models/RewardProfile');
const CoinTransaction = require('../models/CoinTransaction');
const Episode = require('../models/Episode');

function getUserId(req) {
  return String(req.user.id || req.user._id);
}

exports.unlockEpisodeWithCoins = async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      comic_id,
      episode_id,
      coins_required = 10,
    } = req.body;

    const episode = await Episode.findOne({
      id: episode_id,
    });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: 'Episode not found',
      });
    }

    const alreadyUnlocked = await EpisodeUnlock.findOne({
      user_id: userId,
      episode_id,
    });

    if (alreadyUnlocked) {
      return res.json({
        success: true,
        message: 'Episode already unlocked',
        unlocked: alreadyUnlocked,
      });
    }

    let profile = await RewardProfile.findOne({
      user_id: userId,
    });

    if (!profile) {
      profile = await RewardProfile.create({
        user_id: userId,
      });
    }

    if (profile.coins < coins_required) {
      return res.status(400).json({
        success: false,
        message: 'Not enough coins',
        coins: profile.coins,
        coins_required,
      });
    }

    profile.coins -= coins_required;
    await profile.save();

    const unlock = await EpisodeUnlock.create({
      user_id: userId,
      comic_id,
      episode_id,
      unlock_type: 'coins',
      coins_spent: coins_required,
    });

    await CoinTransaction.create({
      user_id: userId,
      amount: -coins_required,
      type: 'spend',
      source: 'episode_unlock',
      description: `Unlocked episode ${episode.title}`,
    });

    res.json({
      success: true,
      message: 'Episode unlocked successfully',
      unlock,
      coins_balance: profile.coins,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to unlock episode',
    });
  }
};

exports.checkEpisodeAccess = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { episode_id } = req.params;

    const episode = await Episode.findOne({
      id: episode_id,
    });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: 'Episode not found',
      });
    }

    const isFree = episode.is_paid !== true;

    const unlocked = await EpisodeUnlock.findOne({
      user_id: userId,
      episode_id,
    });

    const hasAccess = isFree || !!unlocked;

    res.json({
      success: true,
      has_access: hasAccess,
      is_free: isFree,
      is_unlocked: !!unlocked,
      coins_required: 80,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to check episode access',
    });
  }
};

exports.getUnlockedEpisodes = async (req, res) => {
  try {
    const userId = getUserId(req);

    const unlocked = await EpisodeUnlock.find({
      user_id: userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      unlocked,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load unlocked episodes',
    });
  }
};
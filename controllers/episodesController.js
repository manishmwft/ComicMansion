const Episode = require("../models/Episode");
const Purchase = require("../models/Purchase");
const EpisodeUnlock = require("../models/EpisodeUnlock");

const getEpisodes = async (req, res) => {
  try {
    const { comic_id } = req.params;
    const user = req.user;

    const episodes = await Episode.find(
      { comic_id },
      { _id: 0, __v: 0 }
    ).sort({ episode_number: 1 });

    let purchasedIds = [];
    let unlockedIds = [];

    if (user) {
      const userId = String(user.id || user._id);

      const purchases = await Purchase.find({
        user_id: userId,
      });

      purchasedIds = purchases.map((p) => p.episode_id);

      const unlocks = await EpisodeUnlock.find({
        user_id: userId,
      });

      unlockedIds = unlocks.map((u) => u.episode_id);
    }

    const response = episodes.map((ep) => {
      const isUnlocked = unlockedIds.includes(ep.id);
      const isPurchased = purchasedIds.includes(ep.id);

      let is_locked = false;

      if (ep.is_paid) {
        if (!user) {
          is_locked = true;
        } else if (
          !user.is_premium &&
          !isPurchased &&
          !isUnlocked
        ) {
          is_locked = true;
        }
      }

      return {
        id: ep.id,
        comic_id: ep.comic_id,
        title: ep.title,
        episode_number: ep.episode_number,
        cover_url: ep.cover_url,
        is_paid: ep.is_paid,
        is_locked,
        is_unlocked: isUnlocked,
      };
    });

    return res.json(response);
  } catch (error) {
    return res.status(500).json({
      detail: error.message,
    });
  }
};

module.exports = { getEpisodes };
const Page = require("../models/Page");
const Episode = require("../models/Episode");
const Purchase = require("../models/Purchase");
const EpisodeUnlock = require("../models/EpisodeUnlock");

const getPages = async (req, res) => {
  try {
    const { episode_id } = req.params;
    const user = req.user;

    const episode = await Episode.findOne({
      id: episode_id,
    });

    if (!episode) {
      return res.status(404).json({
        detail: "Episode not found",
      });
    }

    const userId = user
      ? String(user.id || user._id)
      : null;

    const isFree =
      episode.is_paid === false ||
      episode.is_locked === false;

    if (!isFree) {
      if (!userId) {
        return res.status(403).json({
          detail: "Episode locked",
        });
      }

      const unlock =
        await EpisodeUnlock.findOne({
          user_id: userId,
          episode_id,
        });

      const purchase =
        await Purchase.findOne({
          user_id: userId,
          episode_id,
        });

      if (!unlock && !purchase) {
        return res.status(403).json({
          detail:
            "Episode locked or not purchased",
        });
      }
    }

    const pages = await Page.find(
      {
        episode_id,
      },
      {
        _id: 0,
        __v: 0,
      }
    ).sort({
      page_number: 1,
      createdAt: 1,
    });

    return res.json(pages);
  } catch (error) {
    console.error(
      "Get pages error:",
      error
    );

    return res.status(500).json({
      detail: error.message,
    });
  }
};

module.exports = {
  getPages,
};
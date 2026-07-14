const User = require("../models/User");
const Episode = require("../models/Episode");
const Page = require("../models/Page");
const EpisodeUnlock = require("../models/EpisodeUnlock");

exports.checkDownloadAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { episode_id } = req.params;

    const user = await User.findOne({ user_id: userId });

    if (!user || !user.is_premium) {
      return res.status(403).json({
        success: false,
        message: "Downloads are available only for Pro users",
      });
    }

    const episode = await Episode.findOne({ episode_id });

    if (!episode) {
      return res.status(404).json({
        success: false,
        message: "Episode not found",
      });
    }

    if (episode.is_premium) {
      const unlocked = await EpisodeUnlock.findOne({
        user_id: userId,
        episode_id,
      });

      if (!unlocked) {
        return res.status(403).json({
          success: false,
          message: "Unlock this episode before downloading",
        });
      }
    }

    const pages = await Page.find({ episode_id }).sort({ index: 1 });

    return res.json({
      success: true,
      episode,
      pages,
      message: "Download access granted",
    });
  } catch (error) {
    console.error("Download access error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
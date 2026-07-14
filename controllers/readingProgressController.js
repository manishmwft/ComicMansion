const ReadingProgress = require('../models/ReadingProgress');
const { handleEpisodeCompleted } = require('../utils/rewardEngine');
const Episode = require('../models/Episode');

exports.saveProgress = async (req, res) => {
  try {
    const user_id = String(req.user.id || req.user._id);

    const {
      comic_id,
      episode_id,
      current_page,
      total_pages,
    } = req.body;

    const progress_percentage =
      total_pages > 0
        ? Math.floor((current_page / total_pages) * 100)
        : 0;

    const is_completed =
      total_pages > 0 && current_page >= total_pages;

    let progress = await ReadingProgress.findOne({
      user_id,
      episode_id,
    });

    const wasAlreadyCompleted =
      progress ? progress.is_completed : false;

    if (progress) {
      progress.current_page = current_page;
      progress.total_pages = total_pages;
      progress.progress_percentage = progress_percentage;
      progress.is_completed = is_completed;
      progress.last_read_at = new Date();

      await progress.save();
    } else {
      progress = await ReadingProgress.create({
        user_id,
        comic_id,
        episode_id,
        current_page,
        total_pages,
        progress_percentage,
        is_completed,
      });
    }

    let rewardResult = null;

    if (is_completed && !wasAlreadyCompleted) {
      rewardResult = await handleEpisodeCompleted(user_id);
    }

    res.json({
      success: true,
      progress,
      rewards: rewardResult,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to save reading progress',
    });
  }
};
exports.getComicProgress = async (req, res) => {
  try {
    const user_id = String(req.user.id || req.user._id);
    const { comic_id } = req.params;

    // Get only episodes that currently exist for this comic.
    const episodes = await Episode.find(
      { comic_id },
      {
        _id: 0,
        id: 1,
        episode_number: 1,
      }
    ).lean();

    const totalEpisodes = episodes.length;

    if (totalEpisodes === 0) {
      return res.json({
        success: true,
        comic_id,
        total_episodes: 0,
        started_episodes: 0,
        completed_episodes: 0,
        progress_percentage: 0,
      });
    }

    const episodeIds = episodes.map((episode) => episode.id);

    // Only load progress for episodes that still exist.
    const progressRecords = await ReadingProgress.find({
      user_id,
      comic_id,
      episode_id: {
        $in: episodeIds,
      },
    }).lean();

    const progressByEpisodeId = new Map(
      progressRecords.map((item) => [
        String(item.episode_id),
        item,
      ])
    );

    let totalProgress = 0;
    let startedEpisodes = 0;
    let completedEpisodes = 0;

    for (const episode of episodes) {
      const progress = progressByEpisodeId.get(
        String(episode.id)
      );

      if (!progress) {
        continue;
      }

      const percentage = Math.max(
        0,
        Math.min(
          100,
          Number(progress.progress_percentage) || 0
        )
      );

      totalProgress += percentage;

      if (
        percentage > 0 ||
        Number(progress.current_page) > 0
      ) {
        startedEpisodes += 1;
      }

      if (
        progress.is_completed === true ||
        percentage >= 100
      ) {
        completedEpisodes += 1;
      }
    }

    const progressPercentage = Math.floor(
      totalProgress / totalEpisodes
    );

    return res.json({
      success: true,
      comic_id,
      total_episodes: totalEpisodes,
      started_episodes: startedEpisodes,
      completed_episodes: completedEpisodes,
      progress_percentage: progressPercentage,
    });
  } catch (error) {
    console.error('Comic progress error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comic progress',
    });
  }
};
exports.getEpisodeProgress = async (
  req,
  res
) => {
  try {
    const user_id = req.user.id || req.user._id;

    const { episode_id } = req.params;

    const progress =
      await ReadingProgress.findOne({
        user_id,
        episode_id,
      });

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch reading progress',
    });
  }
};

exports.getContinueReading = async (
  req,
  res
) => {
  try {
    const user_id = req.user.id || req.user._id;

    const progress =
      await ReadingProgress.find({
        user_id,
      })
        .populate('comic_id')
        .populate('episode_id')
        .sort({
          last_read_at: -1,
        })
        .limit(20);

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        'Failed to fetch continue reading',
    });
  }
};
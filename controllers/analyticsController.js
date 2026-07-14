const Comic = require("../models/Comic");
const ComicActivity = require("../models/ComicActivity");
const { calculateTrendingScore } = require("../utils/trendingScore");

const getUserId = (req) => {
  return req.user?.id || null;
};

const updateComicTrendingScore = async (comicId) => {
  const comic = await Comic.findOne({ id: comicId });

  if (!comic) return;

  const score = calculateTrendingScore({
    totalViews: comic.total_views || 0,
    totalReads: comic.total_reads || 0,
    totalFavorites: comic.total_favorites || 0,
    totalComments: 0,
    lastReadAt: comic.last_read_at,
    createdAt: comic.created_at,
  });

  await Comic.updateOne(
    { id: comicId },
    {
      $set: {
        trending_score: score,
        updated_at: new Date(),
      },
    }
  );
};

exports.trackComicView = async (req, res) => {
  try {
    const {
      comic_id,
      source = "unknown",
      device_id = "",
      platform = "unknown",
    } = req.body;

    if (!comic_id) {
      return res.status(400).json({
        success: false,
        detail: "comic_id is required",
      });
    }

    const comic = await Comic.findOne({ id: comic_id });

    if (!comic) {
      return res.status(404).json({
        success: false,
        detail: "Comic not found",
      });
    }

    await ComicActivity.create({
      user_id: getUserId(req),
      comic_id,
      activity_type: "view",
      source,
      device_id,
      platform,
    });

    await Comic.updateOne(
      { id: comic_id },
      {
        $inc: {
          total_views: 1,
        },
        $set: {
          updated_at: new Date(),
        },
      }
    );

    await updateComicTrendingScore(comic_id);

    const updatedComic = await Comic.findOne({ id: comic_id }).lean();

    return res.json({
      success: true,
      message: "Comic view tracked",
      total_views: updatedComic?.total_views || 0,
      trending_score: updatedComic?.trending_score || 0,
    });
  } catch (error) {
    console.error("TRACK COMIC VIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to track comic view",
    });
  }
};

exports.trackComicRead = async (req, res) => {
  try {
    const {
      comic_id,
      episode_id = "",
      source = "reader",
      device_id = "",
      platform = "unknown",
    } = req.body;

    if (!comic_id) {
      return res.status(400).json({
        success: false,
        detail: "comic_id is required",
      });
    }

    const comic = await Comic.findOne({ id: comic_id });

    if (!comic) {
      return res.status(404).json({
        success: false,
        detail: "Comic not found",
      });
    }

    await ComicActivity.create({
      user_id: getUserId(req),
      comic_id,
      episode_id,
      activity_type: "read",
      source,
      device_id,
      platform,
    });

    await Comic.updateOne(
      { id: comic_id },
      {
        $inc: {
          total_reads: 1,
        },
        $set: {
          last_read_at: new Date(),
          updated_at: new Date(),
        },
      }
    );

    await updateComicTrendingScore(comic_id);

    const updatedComic = await Comic.findOne({ id: comic_id }).lean();

    return res.json({
      success: true,
      message: "Comic read tracked",
      total_reads: updatedComic?.total_reads || 0,
      trending_score: updatedComic?.trending_score || 0,
    });
  } catch (error) {
    console.error("TRACK COMIC READ ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to track comic read",
    });
  }
};
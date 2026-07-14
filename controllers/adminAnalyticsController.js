const Comic = require("../models/Comic");
const Episode = require("../models/Episode");
const ComicActivity = require("../models/ComicActivity");



exports.trendingPage = async (req, res) => {
  try {
    const trendingComics = await Comic.find()
      .sort({
        trending_score: -1,
        total_reads: -1,
        total_views: -1,
      })
      .lean();

    res.render(
      "admin/analytics/trending",
      {
        layout: "layouts/admin",
        title: "Trending Analytics",
        currentPath:
          "/admin/analytics/trending",
        trendingComics,
      }
    );
  } catch (error) {
    console.log(
      "TRENDING ANALYTICS ERROR:",
      error
    );

    req.session.error =
      "Failed to load trending analytics";

    res.redirect(
      "/admin/dashboard"
    );
  }
};

exports.episodePage = async (req, res) => {
  try {
    const readStats = await ComicActivity.aggregate([
      {
        $match: {
          activity_type: "read",
          episode_id: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$episode_id",
          reads: { $sum: 1 },
        },
      },
      {
        $sort: {
          reads: -1,
        },
      },
    ]);

    const episodeIds = readStats.map((item) => item._id);

    const episodes = await Episode.find({
      id: {
        $in: episodeIds,
      },
    }).lean();

    const comicIds = [
      ...new Set(
        episodes.map((episode) => episode.comic_id).filter(Boolean)
      ),
    ];

    const comics = await Comic.find({
      id: {
        $in: comicIds,
      },
    }).lean();

    const episodeAnalytics = readStats.map((stat) => {
      const episode = episodes.find((ep) => ep.id === stat._id);
      const comic = episode
        ? comics.find((c) => c.id === episode.comic_id)
        : null;

      return {
        episode,
        comic,
        reads: stat.reads,
      };
    });

    res.render("admin/analytics/episodes", {
      layout: "layouts/admin",
      title: "Episode Analytics",
      currentPath: "/admin/analytics/episodes",
      episodeAnalytics,
    });
  } catch (error) {
    console.log("EPISODE ANALYTICS ERROR:", error);

    req.session.error = "Failed to load episode analytics";
    res.redirect("/admin/dashboard");
  }
};

exports.genrePage = async (req, res) => {
  try {
    const genreAnalytics = await Comic.aggregate([
      {
        $group: {
          _id: "$genre",
          comics: {
            $sum: 1,
          },
          reads: {
            $sum: "$total_reads",
          },
          views: {
            $sum: "$total_views",
          },
        },
      },
      {
        $addFields: {
          avg_reads_per_comic: {
            $cond: [
              { $gt: ["$comics", 0] },
              {
                $round: [
                  {
                    $divide: ["$reads", "$comics"],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          reads: -1,
          views: -1,
          comics: -1,
        },
      },
    ]);

    res.render("admin/analytics/genres", {
      layout: "layouts/admin",
      title: "Genre Analytics",
      currentPath: "/admin/analytics/genres",
      genreAnalytics,
    });
  } catch (error) {
    console.log("GENRE ANALYTICS ERROR:", error);

    req.session.error = "Failed to load genre analytics";
    res.redirect("/admin/dashboard");
  }
};


exports.activityPage = async (req, res) => {
  try {
    const activities = await ComicActivity.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const comicIds = [
      ...new Set(
        activities
          .map((a) => a.comic_id)
          .filter(Boolean)
      ),
    ];

    const episodeIds = [
      ...new Set(
        activities
          .map((a) => a.episode_id)
          .filter(Boolean)
      ),
    ];

    const [comics, episodes] = await Promise.all([
      Comic.find({
        id: { $in: comicIds },
      }).lean(),

      Episode.find({
        id: { $in: episodeIds },
      }).lean(),
    ]);

    const activityLogs = activities.map(
      (activity) => ({
        ...activity,

        comic: comics.find(
          (c) =>
            c.id === activity.comic_id
        ),

        episode: episodes.find(
          (e) =>
            e.id === activity.episode_id
        ),
      })
    );

    res.render(
      "admin/analytics/activity",
      {
        layout: "layouts/admin",
        title: "Activity Logs",
        currentPath:
          "/admin/analytics/activity",
        activityLogs,
      }
    );
  } catch (error) {
    console.log(
      "ACTIVITY LOG ERROR:",
      error
    );

    req.session.error =
      "Failed to load activity logs";

    res.redirect(
      "/admin/dashboard"
    );
  }
};
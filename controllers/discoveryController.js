const Comic = require("../models/Comic");
const Episode = require("../models/Episode");
const ComicActivity = require("../models/ComicActivity");

const formatComic = async (comic) => {
  const latestEpisode = await Episode.findOne({
    comic_id: comic.id,
  })
    .sort({
      episode_number: -1,
    })
    .lean();

  return {
    id: comic.id,
    title: comic.title,
    description: comic.description,
    thumbnail_url: comic.thumbnail_url,
    view_mode: comic.view_mode,

    total_views: comic.total_views || 0,
    total_reads: comic.total_reads || 0,
    total_favorites: comic.total_favorites || 0,
    trending_score: comic.trending_score || 0,

    is_featured: comic.is_featured || false,
    is_premium: comic.is_premium || false,

    latest_episode: latestEpisode
      ? {
          id: latestEpisode.id,
          title: latestEpisode.title,
          episode_number: latestEpisode.episode_number,
          cover_url: latestEpisode.cover_url,
          is_paid: latestEpisode.is_paid || false,
        }
      : null,
  };
};

exports.getTrendingComics = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const comics = await Comic.find({
  trending_score: { $gt: 0 },
})
      .sort({
        trending_score: -1,
        total_reads: -1,
        total_views: -1,
        created_at: -1,
      })
      .limit(limit)
      .lean();

    const formattedComics = await Promise.all(
      comics.map((comic) => formatComic(comic))
    );

    return res.json({
      success: true,
      title: "Trending Comics",
      comics: formattedComics,
    });
  } catch (error) {
    console.error("GET TRENDING COMICS ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load trending comics",
    });
  }
};


exports.getNewEpisodes = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const episodes = await Episode.find()
      .sort({
        _id: -1,
      })
      .limit(limit)
      .lean();

    const formattedEpisodes = await Promise.all(
      episodes.map(async (episode) => {
        const comic = await Comic.findOne({
          id: episode.comic_id,
        }).lean();

        return {
          id: episode.id,
          title: episode.title,
          episode_number: episode.episode_number,
          cover_url: episode.cover_url,
          is_paid: episode.is_paid || false,
          comic_id: episode.comic_id,
          comic: comic
            ? {
                id: comic.id,
                title: comic.title,
                thumbnail_url: comic.thumbnail_url,
                view_mode: comic.view_mode,
                is_premium: comic.is_premium || false,
              }
            : null,
        };
      })
    );

    return res.json({
      success: true,
      title: "New Episodes",
      episodes: formattedEpisodes,
    });
  } catch (error) {
    console.error("GET NEW EPISODES ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load new episodes",
    });
  }
};

exports.getGenres = async (req, res) => {
  try {
    const genres = await Comic.distinct("genre", {
      genre: {
        $ne: "",
      },
    });

    return res.json({
      success: true,
      genres: genres.length ? genres : ["General"],
    });
  } catch (error) {
    console.error("GET GENRES ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load genres",
    });
  }
};

exports.getComicsByGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    const limit = Number(req.query.limit || 20);

    const comics = await Comic.find({
      genre,
    })
      .sort({
        trending_score: -1,
        total_reads: -1,
        created_at: -1,
      })
      .limit(limit)
      .lean();

    const formattedComics = await Promise.all(
      comics.map((comic) => formatComic(comic))
    );

    return res.json({
      success: true,
      genre,
      comics: formattedComics,
    });
  } catch (error) {
    console.error("GET COMICS BY GENRE ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load genre comics",
    });
  }
};


exports.getRecommendedComics = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const userId = req.user?.id || null;

    let recommendedComics = [];

    if (userId) {
      const userActivities = await ComicActivity.find({
        user_id: userId,
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      const readComicIds = [
        ...new Set(userActivities.map((item) => item.comic_id)),
      ];

      const readComics = await Comic.find({
        id: { $in: readComicIds },
      }).lean();

      const preferredGenres = [
        ...new Set(
          readComics
            .map((comic) => comic.genre)
            .filter((genre) => genre && genre !== "General")
        ),
      ];

      if (preferredGenres.length > 0) {
        recommendedComics = await Comic.find({
          genre: { $in: preferredGenres },
          id: { $nin: readComicIds },
        })
          .sort({
            trending_score: -1,
            total_reads: -1,
            created_at: -1,
          })
          .limit(limit)
          .lean();
      }
    }

    if (recommendedComics.length < limit) {
      const existingIds = recommendedComics.map((comic) => comic.id);

      const fallbackComics = await Comic.find({
        id: { $nin: existingIds },
      })
        .sort({
          trending_score: -1,
          total_reads: -1,
          created_at: -1,
        })
        .limit(limit - recommendedComics.length)
        .lean();

      recommendedComics = [
        ...recommendedComics,
        ...fallbackComics,
      ];
    }

    const formattedComics = await Promise.all(
      recommendedComics.map((comic) => formatComic(comic))
    );

    return res.json({
      success: true,
      title: "Recommended For You",
      comics: formattedComics,
    });
  } catch (error) {
    console.error("GET RECOMMENDED COMICS ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load recommended comics",
    });
  }
};

exports.getHomeFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const trendingComicsRaw = await Comic.find({
      trending_score: { $gt: 0 },
    })
      .sort({
        trending_score: -1,
        total_reads: -1,
        total_views: -1,
        created_at: -1,
      })
      .limit(10)
      .lean();

    const newEpisodesRaw = await Episode.find()
      .sort({
        _id: -1,
      })
      .limit(10)
      .lean();

    const featuredComicsRaw = await Comic.find({
      is_featured: true,
    })
      .sort({
        created_at: -1,
      })
      .limit(5)
      .lean();

    const genres = await Comic.distinct("genre", {
      genre: {
        $ne: "",
      },
    });

    let recommendedComicsRaw = [];

    if (userId) {
      const userActivities = await ComicActivity.find({
        user_id: userId,
      })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

      const readComicIds = [
        ...new Set(userActivities.map((item) => item.comic_id)),
      ];

      const readComics = await Comic.find({
        id: { $in: readComicIds },
      }).lean();

      const preferredGenres = [
        ...new Set(
          readComics
            .map((comic) => comic.genre)
            .filter((genre) => genre && genre !== "General")
        ),
      ];

      if (preferredGenres.length > 0) {
        recommendedComicsRaw = await Comic.find({
          genre: {
            $in: preferredGenres,
          },
          id: {
            $nin: readComicIds,
          },
        })
          .sort({
            trending_score: -1,
            total_reads: -1,
            created_at: -1,
          })
          .limit(10)
          .lean();
      }
    }

    if (recommendedComicsRaw.length < 10) {
      const existingIds = recommendedComicsRaw.map((comic) => comic.id);

      const fallbackComics = await Comic.find({
        id: {
          $nin: existingIds,
        },
      })
        .sort({
          trending_score: -1,
          total_reads: -1,
          created_at: -1,
        })
        .limit(10 - recommendedComicsRaw.length)
        .lean();

      recommendedComicsRaw = [
        ...recommendedComicsRaw,
        ...fallbackComics,
      ];
    }

    const trendingComics = await Promise.all(
      trendingComicsRaw.map((comic) => formatComic(comic))
    );

    const featuredComics = await Promise.all(
      featuredComicsRaw.map((comic) => formatComic(comic))
    );

    const recommendedComics = await Promise.all(
      recommendedComicsRaw.map((comic) => formatComic(comic))
    );

    const newEpisodes = await Promise.all(
      newEpisodesRaw.map(async (episode) => {
        const comic = await Comic.findOne({
          id: episode.comic_id,
        }).lean();

        return {
          id: episode.id,
          title: episode.title,
          episode_number: episode.episode_number,
          cover_url: episode.cover_url,
          is_paid: episode.is_paid || false,
          comic_id: episode.comic_id,
          comic: comic
            ? {
                id: comic.id,
                title: comic.title,
                thumbnail_url: comic.thumbnail_url,
                view_mode: comic.view_mode,
                genre: comic.genre || "General",
                is_premium: comic.is_premium || false,
              }
            : null,
        };
      })
    );

    return res.json({
      success: true,
      sections: {
        featured: {
          title: "Featured Comics",
          comics: featuredComics,
        },
        trending: {
          title: "Trending Now",
          comics: trendingComics,
        },
        new_episodes: {
          title: "New Episodes",
          episodes: newEpisodes,
        },
        recommended: {
          title: "Recommended For You",
          comics: recommendedComics,
        },
        genres: {
          title: "Browse Genres",
          items: genres.length ? genres : ["General"],
        },
      },
    });
  } catch (error) {
    console.error("GET HOME FEED ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load home feed",
    });
  }
};

exports.getFeaturedComics = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);

    const comics = await Comic.find({
      is_featured: true,
    })
      .sort({
        created_at: -1,
      })
      .limit(limit)
      .lean();

    const formattedComics = await Promise.all(
      comics.map((comic) => formatComic(comic))
    );

    return res.json({
      success: true,
      title: "Featured Comics",
      comics: formattedComics,
    });
  } catch (error) {
    console.error("GET FEATURED COMICS ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load featured comics",
    });
  }
};
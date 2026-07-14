const { randomUUID } = require("crypto");
const Comic = require("../models/Comic");
const Episode = require("../models/Episode");
const Page = require("../models/Page");
const User = require("../models/User");
const ComicActivity = require("../models/ComicActivity");

const path = require("path");
const fs = require("fs");
/* ================= DASHBOARD ================= */

exports.dashboard = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      comicsCount,
      episodesCount,
      pagesCount,
      usersCount,
      totalViewsResult,
      totalReadsResult,
      activeReadersToday,
      latestComics,
      trendingComics,
      mostReadActivities,
      recentActivities,
      genreStats,
    ] = await Promise.all([
      Comic.countDocuments(),
      Episode.countDocuments(),
      Page.countDocuments(),
      User.countDocuments(),

      Comic.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$total_views" },
          },
        },
      ]),

      Comic.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$total_reads" },
          },
        },
      ]),

      ComicActivity.distinct("user_id", {
        activity_type: "read",
        createdAt: { $gte: startOfToday },
        user_id: { $ne: null },
      }),

      Comic.find().sort({ _id: -1 }).limit(5).lean(),

      Comic.find({
        trending_score: { $gt: 0 },
      })
        .sort({
          trending_score: -1,
          total_reads: -1,
          total_views: -1,
        })
        .limit(5)
        .lean(),

      ComicActivity.aggregate([
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
        {
          $limit: 5,
        },
      ]),

      ComicActivity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const episodeIds = mostReadActivities.map((item) => item._id);

    const mostReadEpisodesRaw = await Episode.find({
      id: { $in: episodeIds },
    }).lean();

    const mostReadEpisodes = mostReadActivities.map((item) => {
      const episode = mostReadEpisodesRaw.find((e) => e.id === item._id);

      return {
        episode,
        reads: item.reads,
      };
    });

    const activityComicIds = [
      ...new Set(recentActivities.map((item) => item.comic_id).filter(Boolean)),
    ];

    const activityEpisodeIds = [
      ...new Set(recentActivities.map((item) => item.episode_id).filter(Boolean)),
    ];

    const [activityComics, activityEpisodes] = await Promise.all([
      Comic.find({ id: { $in: activityComicIds } }).lean(),
      Episode.find({ id: { $in: activityEpisodeIds } }).lean(),
    ]);

    const formattedActivities = recentActivities.map((activity) => {
      const comic = activityComics.find((c) => c.id === activity.comic_id);
      const episode = activityEpisodes.find((e) => e.id === activity.episode_id);

      return {
        ...activity,
        comic,
        episode,
      };
    });
    Comic.aggregate([
  {
    $group: {
      _id: "$genre",
      comics: { $sum: 1 },
      reads: { $sum: "$total_reads" },
      views: { $sum: "$total_views" },
    },
  },
  {
    $sort: {
      reads: -1,
      comics: -1,
    },
  },
  {
    $limit: 8,
  },
]),

    res.render("admin/dashboard", {
      layout: "layouts/admin",
      title: "Dashboard",
      currentPath: "/admin/dashboard",
      stats: {
        comicsCount,
        episodesCount,
        pagesCount,
        usersCount,
        totalViews: totalViewsResult[0]?.total || 0,
        totalReads: totalReadsResult[0]?.total || 0,
        activeReadersToday: activeReadersToday.length,
        trendingCount: trendingComics.length,
      },
      latestComics,
      trendingComics,
      mostReadEpisodes,
      recentActivities: formattedActivities,
      genreStats,
    });
  } catch (error) {
    console.log("ADMIN DASHBOARD ERROR:", error);

    req.session.error = "Failed to load dashboard";
    res.redirect("/admin/comics");
  }
};

/* ================= COMICS ================= */

exports.comicsList = async (req, res) => {
  try {
    const comics = await Comic.find().lean();

    res.render("comics/index", {
      layout: "layouts/admin",
      title: "Comics",
      currentPath: "/admin/comics",
      comics,
    });
  } catch (error) {
    req.session.error = "Failed to load comics";
    res.redirect("/admin/dashboard");
  }
};

exports.comicForm = async (req, res) => {
  try {
    const comic = req.params.id
      ? await Comic.findOne({ id: req.params.id }).lean()
      : {};

    res.render("comics/form", {
      layout: "layouts/admin",
      title: comic?.id ? "Edit Comic" : "Create Comic",
      currentPath: "/admin/comics",
      comic,
    });
  } catch (error) {
    req.session.error = "Failed to load comic form";
    res.redirect("/admin/comics");
  }
};

exports.createComic = async (req, res) => {
  try {
    const thumbnailPath = req.file
      ? `/uploads/comics/${req.file.filename}`
      : "";

    await Comic.create({
      id: randomUUID(),
      title: req.body.title || "",
      description: req.body.description || "",
      thumbnail_url: thumbnailPath,

      // ✅ NEW
      view_mode: req.body.view_mode || "vertical",
      genre: req.body.genre || "General",
tags: req.body.tags
  ? req.body.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
  : [],
language: req.body.language || "English",
age_rating: req.body.age_rating || "13+",
is_featured: req.body.is_featured === "true",
    });

    req.session.success = "Comic created successfully";
    res.redirect("/admin/comics");

  } catch (error) {
    console.log(error);

    req.session.error = "Failed to create comic";
    res.redirect("/admin/comics");
  }
};

exports.updateComic = async (req, res) => {
  try {
    const comic = await Comic.findOne({
      id: req.params.id,
    });

    const updateData = {
      title: req.body.title || "",
      description: req.body.description || "",

      // ✅ NEW
      view_mode: req.body.view_mode || "vertical",
      genre: req.body.genre || "General",
tags: req.body.tags
  ? req.body.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
  : [],
language: req.body.language || "English",
age_rating: req.body.age_rating || "13+",
is_featured: req.body.is_featured === "true",
    };

    if (req.file) {
      updateData.thumbnail_url =
        `/uploads/comics/${req.file.filename}`;
    } else {
      updateData.thumbnail_url = comic.thumbnail_url;
    }

    await Comic.updateOne(
      { id: req.params.id },
      updateData
    );

    req.session.success = "Comic updated successfully";
    res.redirect("/admin/comics");

  } catch (error) {
    console.log(error);

    req.session.error = "Failed to update comic";
    res.redirect("/admin/comics");
  }
};

exports.deleteComic = async (req, res) => {
  try {
    const comic = await Comic.findOne({
      id: req.params.id,
    });

    if (!comic) {
      req.session.error = "Comic not found";
      return res.redirect("/admin/comics");
    }

    // Find all episodes under comic
    const episodes = await Episode.find({
      comic_id: comic.id,
    });

    const episodeIds = episodes.map((episode) => episode.id);

    // Find all pages under all episodes
    const pages = await Page.find({
      episode_id: {
        $in: episodeIds,
      },
    });

    // Delete all page image files
    for (const page of pages) {
      deleteUploadedFile(page.image_url);
    }

    // Delete all episode cover files
    for (const episode of episodes) {
      deleteUploadedFile(episode.cover_url);
    }

    // Delete comic thumbnail
    deleteUploadedFile(comic.thumbnail_url);

    // Delete pages
    await Page.deleteMany({
      episode_id: {
        $in: episodeIds,
      },
    });

    // Delete episodes
    await Episode.deleteMany({
      comic_id: comic.id,
    });

    // Delete comic
    await Comic.deleteOne({
      id: comic.id,
    });

    req.session.success = "Comic and all related data deleted successfully";

    res.redirect("/admin/comics");
  } catch (error) {
    console.log("DELETE COMIC ERROR:", error);

    req.session.error = "Failed to delete comic";
    res.redirect("/admin/comics");
  }
};

/* ================= EPISODES ================= */

exports.episodesList = async (req, res) => {
  try {
    const comic = await Comic.findOne({ id: req.params.comic_id }).lean();

    const episodes = await Episode.find({ comic_id: req.params.comic_id })
      .sort({ episode_number: 1 })
      .lean();

    res.render("episodes/index", {
      layout: "layouts/admin",
     title: `${comic?.title || ""}`,
      currentPath: "/admin/comics",
      episodes,
      comic_id: req.params.comic_id,
      comic,
    });
  } catch (error) {
    req.session.error = "Failed to load episodes";
    res.redirect("/admin/comics");
  }
};

const deleteUploadedFile = (fileUrl) => {
  try {
    if (!fileUrl) return;

    const cleanPath = fileUrl.startsWith("/")
      ? fileUrl.substring(1)
      : fileUrl;

    const fullPath = path.join(__dirname, "..", "public", cleanPath.replace("uploads/", "uploads/"));

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.log("FILE DELETE ERROR:", error.message);
  }
};

exports.episodeForm = async (req, res) => {
  try {
    const episode = req.params.id
      ? await Episode.findOne({ id: req.params.id }).lean()
      : {};

    const comic_id = episode?.comic_id || req.params.comic_id;

    res.render("episodes/form", {
      layout: "layouts/admin",
      title: episode?.id ? "Edit Episode" : "Create Episode",
      currentPath: "/admin/comics",
      episode,
      comic_id,
    });
  } catch (error) {
    req.session.error = "Failed to load episode form";
    res.redirect("/admin/comics");
  }
};

exports.createEpisode = async (req, res) => {
  try {
    const comic_id = req.params.comic_id;

    // 🔥 Get last episode number
    const lastEpisode = await Episode.findOne({ comic_id })
      .sort({ episode_number: -1 });

    const nextEpisodeNumber = lastEpisode
      ? lastEpisode.episode_number + 1
      : 1;

    // 🎯 Handle cover upload
    const coverPath = req.file
      ? `/uploads/episodes/${req.file.filename}`
      : "";

    await Episode.create({
      id: randomUUID(),
      comic_id,
      title: req.body.title || "",
      episode_number: nextEpisodeNumber,
      cover_url: coverPath,
      is_paid: req.body.is_paid === "true",
    });

    req.session.success = `Episode ${nextEpisodeNumber} created`;
    res.redirect(`/admin/episodes/${comic_id}`);

  } catch (error) {
    req.session.error = "Failed to create episode";
    res.redirect(`/admin/episodes/${req.params.comic_id}`);
  }
};

exports.updateEpisode = async (req, res) => {
  try {
    const episode = await Episode.findOne({ id: req.params.id });

    if (!episode) {
      req.session.error = "Episode not found";
      return res.redirect("/admin/comics");
    }

    const updateData = {
      title: req.body.title || "",
      is_paid: req.body.is_paid === "true",
    };

    // 🎯 Update cover if uploaded
    if (req.file) {
      updateData.cover_url = `/uploads/episodes/${req.file.filename}`;
    } else {
      updateData.cover_url = episode.cover_url;
    }

    await Episode.updateOne({ id: req.params.id }, updateData);

    req.session.success = "Episode updated successfully";
    res.redirect(`/admin/episodes/${episode.comic_id}`);

  } catch (error) {
    req.session.error = "Failed to update episode";
    res.redirect("/admin/comics");
  }
};

exports.deleteEpisode = async (req, res) => {
  try {
    const episode = await Episode.findOne({
      id: req.params.id,
    });

    if (!episode) {
      req.session.error = "Episode not found";
      return res.redirect("/admin/comics");
    }

    // Find all pages under this episode
    const pages = await Page.find({
      episode_id: episode.id,
    });

    // Delete all page image files
    for (const page of pages) {
      deleteUploadedFile(page.image_url);
    }

    // Delete episode cover image
    deleteUploadedFile(episode.cover_url);

    // Delete all page records
    await Page.deleteMany({
      episode_id: episode.id,
    });

    // Delete episode record
    await Episode.deleteOne({
      id: episode.id,
    });

    req.session.success = "Episode and related pages deleted successfully";

    res.redirect(`/admin/episodes/${episode.comic_id}`);
  } catch (error) {
    console.log("DELETE EPISODE ERROR:", error);

    req.session.error = "Failed to delete episode";
    res.redirect("/admin/comics");
  }
};

// reorder pages 
exports.reorderPages = async (
  req,
  res
) => {
  try {
    const {
      episode_id,
      page_ids,
    } = req.body;

    if (!episode_id) {
      return res.status(400).json({
        success: false,
        message:
          "Episode ID is required",
      });
    }

    if (
      !Array.isArray(page_ids) ||
      page_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page IDs are required",
      });
    }

    const uniquePageIds = [
      ...new Set(
        page_ids.map(String)
      ),
    ];

    if (
      uniquePageIds.length !==
      page_ids.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate page IDs found",
      });
    }

    const existingPages =
      await Page.find({
        episode_id:
          String(episode_id),
        id: {
          $in: uniquePageIds,
        },
      }).select("id");

    if (
      existingPages.length !==
      uniquePageIds.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more pages do not belong to this episode",
      });
    }

    const operations =
      uniquePageIds.map(
        (pageId, index) => ({
          updateOne: {
            filter: {
              id: pageId,
              episode_id:
                String(episode_id),
            },
            update: {
              $set: {
                page_number:
                  index + 1,
              },
            },
          },
        })
      );

    await Page.bulkWrite(
      operations
    );

    return res.status(200).json({
      success: true,
      message:
        "Page order updated successfully",
    });
  } catch (error) {
    console.error(
      "Reorder pages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update page order",
    });
  }
};

/* ================= PAGES ================= */

exports.pagesList = async (req, res) => {
  try {
    const episodeId = String(
      req.params.episode_id
    );

    const episode = await Episode.findOne({
      id: episodeId,
    }).lean();

    if (!episode) {
      req.session.error = "Episode not found";
      return res.redirect("/admin/comics");
    }

    const comic = await Comic.findOne({
      id: episode.comic_id,
    }).lean();

    let pages = await Page.find({
      episode_id: episodeId,
    })
      .sort({
        page_number: 1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    const needsNormalization = pages.some(
      (page, index) =>
        Number(page.page_number) !== index + 1
    );

    if (
      needsNormalization &&
      pages.length > 0
    ) {
      const operations = pages.map(
        (page, index) => ({
          updateOne: {
            filter: {
              id: page.id,
              episode_id: episodeId,
            },
            update: {
              $set: {
                page_number: index + 1,
              },
            },
          },
        })
      );

      await Page.bulkWrite(operations);

      pages = await Page.find({
        episode_id: episodeId,
      })
        .sort({
          page_number: 1,
          createdAt: 1,
          _id: 1,
        })
        .lean();
    }

    return res.render("pages/index", {
      layout: "layouts/admin",
      title: comic?.title || "Pages",
      currentPath: "/admin/comics",
      pages,
      episode_id: episodeId,
      episode,
      comic,
    });
  } catch (error) {
    console.log(
      "PAGES LIST ERROR:",
      error
    );

    req.session.error =
      "Failed to load pages";

    return res.redirect(
      "/admin/comics"
    );
  }
};

exports.pageForm = async (req, res) => {
  try {
    const page = req.params.id
      ? await Page.findOne({ id: req.params.id }).lean()
      : {};

    const episode_id = page?.episode_id || req.params.episode_id;

    res.render("pages/form", {
      layout: "layouts/admin",
      title: page?.id ? "Edit Page" : "Add Page",
      currentPath: "/admin/comics",
      page,
      episode_id,
    });
  } catch (error) {
    req.session.error = "Failed to load page form";
    res.redirect("/admin/comics");
  }
};

exports.createPage = async (req, res) => {
  try {

    if (!req.files || req.files.length === 0) {
      req.session.error =
        "Please upload at least one page image";

      return res.redirect(
        `/admin/pages/add/${req.params.episode_id}`
      );
    }

    // ✅ CREATE PAGES
    const pagesToCreate = req.files.map((file) => ({
      id: randomUUID(),
      episode_id: req.params.episode_id,
      image_url: `/uploads/pages/${file.filename}`,
    }));

    await Page.insertMany(pagesToCreate);

    req.session.success =
      `${pagesToCreate.length} page(s) uploaded successfully`;

    res.redirect(
      `/admin/pages/${req.params.episode_id}`
    );

  } catch (error) {

    console.log(error);

    req.session.error = "Failed to upload pages";

    res.redirect(
      `/admin/pages/add/${req.params.episode_id}`
    );
  }
};

exports.updatePage = async (req, res) => {
  try {

    const page = await Page.findOne({
      id: req.params.id,
    });

    if (!page) {

      req.session.error = "Page not found";

      return res.redirect("/admin/comics");
    }

    const updateData = {};

    // ✅ UPDATE IMAGE
    if (req.file) {

      updateData.image_url =
        `/uploads/pages/${req.file.filename}`;

    } else {

      updateData.image_url = page.image_url;
    }

    await Page.updateOne(
      { id: req.params.id },
      updateData
    );

    req.session.success =
      "Page updated successfully";

    res.redirect(
      `/admin/pages/${page.episode_id}`
    );

  } catch (error) {

    console.log(error);

    req.session.error =
      "Failed to update page";

    res.redirect("/admin/comics");
  }
};

exports.deletePage = async (
  req,
  res
) => {
  try {
    const page = await Page.findOne({
      id: req.params.id,
    });

    if (!page) {
      req.session.error =
        "Page not found";

      return res.redirect(
        "/admin/comics"
      );
    }

    const episodeId =
      String(page.episode_id);

    deleteUploadedFile(
      page.image_url
    );

    await Page.deleteOne({
      id: req.params.id,
    });

    const remainingPages =
      await Page.find({
        episode_id: episodeId,
      })
        .sort({
          page_number: 1,
          createdAt: 1,
          _id: 1,
        })
        .select("id");

    if (
      remainingPages.length > 0
    ) {
      const operations =
        remainingPages.map(
          (remainingPage, index) => ({
            updateOne: {
              filter: {
                id: remainingPage.id,
                episode_id: episodeId,
              },
              update: {
                $set: {
                  page_number:
                    index + 1,
                },
              },
            },
          })
        );

      await Page.bulkWrite(
        operations
      );
    }

    req.session.success =
      "Page deleted successfully";

    return res.redirect(
      `/admin/pages/${episodeId}`
    );
  } catch (error) {
    console.log(
      "DELETE PAGE ERROR:",
      error
    );

    req.session.error =
      "Failed to delete page";

    return res.redirect(
      "/admin/comics"
    );
  }
};
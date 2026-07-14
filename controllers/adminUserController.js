const User = require("../models/User");

const ComicActivity = require("../models/ComicActivity");
const Comic = require("../models/Comic");
const Episode = require("../models/Episode");
const CoinTransaction = require("../models/CoinTransaction");
exports.usersList = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ _id: -1 })
      .lean();

    res.render("admin/users/index", {
      layout: "layouts/admin",
      title: "Users",
      currentPath: "/admin/users",
      users,
    });
  } catch (error) {
    console.log("ADMIN USERS ERROR:", error);

    req.session.error = "Failed to load users";
    res.redirect("/admin/dashboard");
  }
};

exports.userDetails = async (req, res) => {
  try {
    const user = await User.findOne({
      id: req.params.id,
    }).lean();

    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/admin/users");
    }

    const activities = await ComicActivity.find({
      user_id: user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
      const coinTransactions = await CoinTransaction.find({
  user_id: user.id.toString(),
})
  .sort({ createdAt: -1 })
  .limit(20)
  .lean();

    const comicIds = [
      ...new Set(
        activities.map(a => a.comic_id).filter(Boolean)
      ),
    ];

    const episodeIds = [
      ...new Set(
        activities.map(a => a.episode_id).filter(Boolean)
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

    const formattedActivities = activities.map(
      activity => ({
        ...activity,
        comic: comics.find(
          c => c.id === activity.comic_id
        ),
        episode: episodes.find(
          e => e.id === activity.episode_id
        ),
      })
    );

    const totalReads = activities.filter(
      a => a.activity_type === "read"
    ).length;

    const totalViews = activities.filter(
      a => a.activity_type === "view"
    ).length;

    res.render(
      "admin/users/details",
      {
        layout: "layouts/admin",
        title: "User Details",
        currentPath: "/admin/users",
        user,
        totalReads,
        totalViews,
        activities: formattedActivities,
          coinTransactions,

      }
    );
  } catch (error) {
    console.log(
      "USER DETAILS ERROR:",
      error
    );

    req.session.error =
      "Failed to load user";

    res.redirect("/admin/users");
  }
};

exports.adjustCoins = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const amount = Number(req.body.amount);
    const action = req.body.action;
    const reason = req.body.reason || "Admin adjustment";

    if (!amount || amount <= 0) {
      req.session.error = "Amount must be greater than 0";
      return res.redirect(`/admin/users/${userId}`);
    }

    const user = await User.findOne({ id: userId });

    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/admin/users");
    }

    if (action === "deduct" && user.coins < amount) {
      req.session.error = "User does not have enough coins";
      return res.redirect(`/admin/users/${userId}`);
    }

    const finalAmount = action === "deduct" ? -amount : amount;

    user.coins = (user.coins || 0) + finalAmount;
    await user.save();

    await CoinTransaction.create({
      user_id: user.id.toString(),
      amount,
      type: action === "deduct" ? "spend" : "earn",
      source: "admin",
      description: reason,
    });

    req.session.success =
      action === "deduct"
        ? `${amount} coins deducted successfully`
        : `${amount} coins added successfully`;

    res.redirect(`/admin/users/${userId}`);
  } catch (error) {
    console.log("ADMIN COIN ADJUST ERROR:", error);

    req.session.error = "Failed to update coins";
    res.redirect(`/admin/users/${req.params.id}`);
  }
};
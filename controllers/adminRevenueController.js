const CoinTransaction = require("../models/CoinTransaction");
const CoinPackage = require("../models/CoinPackage");

exports.index = async (req, res) => {
  try {
    const [
      totalEarned,
      totalSpent,
      adminGranted,
      episodeUnlocks,
      recentTransactions,
      coinPackages,
    ] = await Promise.all([
      CoinTransaction.aggregate([
        { $match: { type: "earn" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      CoinTransaction.aggregate([
        { $match: { type: "spend" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      CoinTransaction.aggregate([
        { $match: { source: "admin", type: "earn" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      CoinTransaction.aggregate([
        { $match: { source: "episode_unlock", type: "spend" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      CoinTransaction.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),

      CoinPackage.find()
        .sort({ sort_order: 1, createdAt: -1 })
        .lean(),
    ]);

    res.render("admin/revenue/index", {
      layout: "layouts/admin",
      title: "Revenue Analytics",
      currentPath: "/admin/revenue",
      stats: {
        totalEarned: totalEarned[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0,
        adminGranted: adminGranted[0]?.total || 0,
        episodeUnlocks: episodeUnlocks[0]?.total || 0,
      },
      recentTransactions,
      coinPackages,
    });
  } catch (error) {
    console.log("REVENUE ANALYTICS ERROR:", error);

    req.session.error = "Failed to load revenue analytics";
    res.redirect("/admin/dashboard");
  }
};
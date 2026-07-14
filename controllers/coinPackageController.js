const CoinPackage = require("../models/CoinPackage");

exports.getActivePackages = async (req, res) => {
  try {
    const packages = await CoinPackage.find({
      is_active: true,
    })
      .sort({
        sort_order: 1,
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.log("GET COIN PACKAGES ERROR:", error);

    return res.status(500).json({
      success: false,
      detail: "Failed to load coin packages",
    });
  }
};
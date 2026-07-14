const { randomUUID } = require("crypto");
const CoinPackage = require("../models/CoinPackage");

exports.index = async (req, res) => {
  try {
    const packages = await CoinPackage.find()
      .sort({
        sort_order: 1,
        createdAt: -1,
      })
      .lean();

    res.render("admin/coin-packages/index", {
      layout: "layouts/admin",
      title: "Coin Packages",
      currentPath: "/admin/coin-packages",
      packages,
    });
  } catch (error) {
    console.log("COIN PACKAGE LIST ERROR:", error);

    req.session.error = "Failed to load coin packages";
    res.redirect("/admin/dashboard");
  }
};

exports.form = async (req, res) => {
  try {
    const coinPackage = req.params.id
      ? await CoinPackage.findOne({
          id: req.params.id,
        }).lean()
      : {};

    res.render("admin/coin-packages/form", {
      layout: "layouts/admin",
      title: coinPackage?.id ? "Edit Coin Package" : "Add Coin Package",
      currentPath: "/admin/coin-packages",
      coinPackage,
    });
  } catch (error) {
    console.log("COIN PACKAGE FORM ERROR:", error);

    req.session.error = "Failed to load form";
    res.redirect("/admin/coin-packages");
  }
};

exports.create = async (req, res) => {
  try {
    await CoinPackage.create({
      id: randomUUID(),
      title: req.body.title || "",
      coins: Number(req.body.coins || 0),
      price: Number(req.body.price || 0),
      bonus_coins: Number(req.body.bonus_coins || 0),
      is_active: req.body.is_active === "true",
      sort_order: Number(req.body.sort_order || 0),
    });

    req.session.success = "Coin package created successfully";
    res.redirect("/admin/coin-packages");
  } catch (error) {
    console.log("COIN PACKAGE CREATE ERROR:", error);

    req.session.error = "Failed to create coin package";
    res.redirect("/admin/coin-packages/add");
  }
};

exports.update = async (req, res) => {
  try {
    await CoinPackage.updateOne(
      {
        id: req.params.id,
      },
      {
        title: req.body.title || "",
        coins: Number(req.body.coins || 0),
        price: Number(req.body.price || 0),
        bonus_coins: Number(req.body.bonus_coins || 0),
        is_active: req.body.is_active === "true",
        sort_order: Number(req.body.sort_order || 0),
      }
    );

    req.session.success = "Coin package updated successfully";
    res.redirect("/admin/coin-packages");
  } catch (error) {
    console.log("COIN PACKAGE UPDATE ERROR:", error);

    req.session.error = "Failed to update coin package";
    res.redirect(`/admin/coin-packages/edit/${req.params.id}`);
  }
};

exports.remove = async (req, res) => {
  try {
    await CoinPackage.deleteOne({
      id: req.params.id,
    });

    req.session.success = "Coin package deleted successfully";
    res.redirect("/admin/coin-packages");
  } catch (error) {
    console.log("COIN PACKAGE DELETE ERROR:", error);

    req.session.error = "Failed to delete coin package";
    res.redirect("/admin/coin-packages");
  }
};
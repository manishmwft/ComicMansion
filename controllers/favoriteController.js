const { randomUUID } = require("crypto");
const Favorite = require("../models/Favorite");
const Comic = require("../models/Comic");

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user_id: req.user.id }).lean();

    const comicIds = favorites.map((fav) => fav.comic_id);

    const comics = await Comic.find(
      { id: { $in: comicIds } },
      { _id: 0, __v: 0 }
    ).lean();

    return res.json(comics);
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { comic_id } = req.body;

    if (!comic_id) {
      return res.status(400).json({ detail: "comic_id is required" });
    }

    const comic = await Comic.findOne({ id: comic_id });

    if (!comic) {
      return res.status(404).json({ detail: "Comic not found" });
    }

    const exists = await Favorite.findOne({
      user_id: req.user.id,
      comic_id,
    });

    if (!exists) {
      await Favorite.create({
        id: randomUUID(),
        user_id: req.user.id,
        comic_id,
      });
    }

    return res.json({ message: "Favorite added" });
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { comic_id } = req.params;

    await Favorite.deleteOne({
      user_id: req.user.id,
      comic_id,
    });

    return res.json({ message: "Favorite removed" });
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};  
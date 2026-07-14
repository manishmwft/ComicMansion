const { randomUUID } = require("crypto");
const Comic = require("../models/Comic");

const createComic = async (req, res) => {
  try {
    const { title, description, thumbnail_url } = req.body;

    const comic = await Comic.create({
      id: randomUUID(),
      title: title || "",
      description: description || "",
      thumbnail_url: thumbnail_url || "",
    });

    return res.json({
      id: comic.id,
      title: comic.title,
      description: comic.description,
      thumbnail_url: comic.thumbnail_url,
    });
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

const getComics = async (req, res) => {
  try {
    const comics = await Comic.find({}, { _id: 0, __v: 0 }).sort({ id: 1 }).lean();
    return res.json(comics);
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  createComic,
  getComics,
};
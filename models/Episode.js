const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    comic_id: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
    },
    episode_number: {
      type: Number,
      default: 0,
    },
    cover_url: {
      type: String,
      default: "",
    },
    is_paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    collection: "episodes",
  }
);

module.exports = mongoose.model("Episode", episodeSchema);
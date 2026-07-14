const mongoose = require("mongoose");

const comicActivitySchema = new mongoose.Schema(
  {
    user_id: {
      type: Number,
      default: null,
      index: true,
    },

    comic_id: {
      type: String,
      required: true,
      index: true,
    },

    episode_id: {
      type: String,
      default: "",
      index: true,
    },

    activity_type: {
      type: String,
      enum: ["view", "read"],
      required: true,
      index: true,
    },

    source: {
      type: String,
      enum: ["home", "search", "genre", "details", "reader", "unknown"],
      default: "unknown",
    },

    device_id: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      enum: ["android", "ios", "web", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
    collection: "comic_activities",
  }
);

comicActivitySchema.index({
  comic_id: 1,
  activity_type: 1,
  createdAt: -1,
});

comicActivitySchema.index({
  user_id: 1,
  createdAt: -1,
});

module.exports = mongoose.model("ComicActivity", comicActivitySchema);
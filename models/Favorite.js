const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: Number,
      required: true,
      index: true,
    },
    comic_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    versionKey: false,
    collection: "favorites",
    timestamps: true,
  }
);

favoriteSchema.index({ user_id: 1, comic_id: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
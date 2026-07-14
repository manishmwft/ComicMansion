const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    episode_id: {
      type: String,
      required: true,
      index: true,
    },

    image_url: {
      type: String,
      required: true,
    },

    page_number: {
      type: Number,
      required: true,
      default: 1,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pageSchema.index({
  episode_id: 1,
  page_number: 1,
});

module.exports = mongoose.model(
  "Page",
  pageSchema
);
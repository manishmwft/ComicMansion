const mongoose = require('mongoose');

const readingProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    comic_id: {
      type: String,
      required: true,
    },

    episode_id: {
      type: String,
      required: true,
    },

    current_page: {
      type: Number,
      default: 0,
    },

    total_pages: {
      type: Number,
      default: 0,
    },

    progress_percentage: {
      type: Number,
      default: 0,
    },

    is_completed: {
      type: Boolean,
      default: false,
    },

    last_read_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

readingProgressSchema.index(
  {
    user_id: 1,
    episode_id: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  'ReadingProgress',
  readingProgressSchema
);
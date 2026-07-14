const mongoose = require('mongoose');

const episodeUnlockSchema = new mongoose.Schema(
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

    unlock_type: {
      type: String,
      enum: ['coins', 'premium', 'admin'],
      default: 'coins',
    },

    coins_spent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

episodeUnlockSchema.index(
  {
    user_id: 1,
    episode_id: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('EpisodeUnlock', episodeUnlockSchema);
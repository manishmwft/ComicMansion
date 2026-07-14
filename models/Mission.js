const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    mission_type: {
      type: String,
      enum: [
        'read_episode',
        'post_comment',
        'checkin',
        'read_multiple',
        'like_comments',
        'favorite_comics',
        'explore_comics',
      ],
      required: true,
    },

    target_count: {
      type: Number,
      required: true,
    },

    reward_xp: {
      type: Number,
      default: 0,
    },

    reward_coins: {
      type: Number,
      default: 0,
    },

    reset_type: {
      type: String,
      enum: ['daily', 'weekly', 'once'],
      default: 'daily',
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Mission', missionSchema);
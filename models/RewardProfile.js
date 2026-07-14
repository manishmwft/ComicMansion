const mongoose = require('mongoose');

const rewardProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },

    level: {
      type: Number,
      default: 1,
    },

    total_xp: {
      type: Number,
      default: 0,
    },

    coins: {
      type: Number,
      default: 0,
    },

    streak_count: {
      type: Number,
      default: 0,
    },

    last_checkin_date: {
      type: Date,
      default: null,
    },

    last_daily_reward_date: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RewardProfile', rewardProfileSchema);
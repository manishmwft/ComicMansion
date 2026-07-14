const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    icon: {
      type: String,
      default: 'star',
    },

    requirement_type: {
      type: String,
      enum: [
        'episodes_read',
        'streak',
        'coins_earned',
        'comments',
        'favorites',
        'level',
      ],
      required: true,
    },

    requirement_value: {
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

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Badge', badgeSchema);
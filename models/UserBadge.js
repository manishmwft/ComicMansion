const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    badge_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
    },

    unlocked_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userBadgeSchema.index(
  {
    user_id: 1,
    badge_id: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('UserBadge', userBadgeSchema);
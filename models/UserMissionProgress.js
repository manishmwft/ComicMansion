const mongoose = require('mongoose');

const userMissionProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    mission_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mission',
      required: true,
    },

    progress_count: {
      type: Number,
      default: 0,
    },

    is_completed: {
      type: Boolean,
      default: false,
    },

    is_claimed: {
      type: Boolean,
      default: false,
    },

    period_key: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userMissionProgressSchema.index(
  {
    user_id: 1,
    mission_id: 1,
    period_key: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  'UserMissionProgress',
  userMissionProgressSchema
);
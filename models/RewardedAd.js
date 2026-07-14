const mongoose = require("mongoose");

const rewardedAdSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    ad_type: {
      type: String,
      enum: [
        "daily_reward",
        "coin_reward",
        "premium_unlock",
        "event_reward",
      ],
      default: "coin_reward",
    },

    reward_type: {
      type: String,
      enum: ["coins", "xp", "temporary_unlock", "special"],
      default: "coins",
    },

    reward_coins: {
      type: Number,
      default: 15,
    },

    reward_xp: {
      type: Number,
      default: 0,
    },

    ad_network: {
      type: String,
      enum: ["admob", "unity_ads", "applovin", "other"],
      default: "admob",
    },

    ad_unit_id: {
      type: String,
      default: "",
    },

    reward_transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CoinTransaction",
      default: null,
    },

    device_id: {
      type: String,
      default: "",
      index: true,
    },

    session_id: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      enum: ["android", "ios", "web", "unknown"],
      default: "unknown",
    },

    status: {
      type: String,
      enum: ["completed", "rejected", "failed"],
      default: "completed",
    },

    reject_reason: {
      type: String,
      default: "",
    },

    reward_date: {
      type: String,
      required: true,
      index: true,
    },

    completed_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

rewardedAdSchema.index({
  user_id: 1,
  reward_date: 1,
});

rewardedAdSchema.index({
  user_id: 1,
  completed_at: -1,
});

module.exports = mongoose.model("RewardedAd", rewardedAdSchema);
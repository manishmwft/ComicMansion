const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    device_id: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      enum: ["android", "ios", "web", "unknown"],
      default: "unknown",
    },

    is_revoked: {
      type: Boolean,
      default: false,
    },

    expires_at: {
      type: Date,
      required: true,
      index: true,
    },

    revoked_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({
  user_id: 1,
  is_revoked: 1,
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
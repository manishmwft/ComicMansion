const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  is_premium: {
    type: Boolean,
    default: false,
  },

  // ===== GAMIFICATION =====

  coins: {
    type: Number,
    default: 0,
  },

  xp: {
    type: Number,
    default: 0,
  },

  level: {
    type: Number,
    default: 1,
  },

  streak: {
    type: Number,
    default: 0,
  },
},
{
  timestamps: true,
  versionKey: false,
  collection: "users",
}
);

module.exports = mongoose.model("User", userSchema);
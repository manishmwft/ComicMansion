const mongoose = require("mongoose");

const comicSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    thumbnail_url: {
      type: String,
      default: "",
    },

    view_mode: {
      type: String,
      enum: ["vertical", "horizontal"],
      default: "vertical",
    },
    genre: {
  type: String,
  default: "General",
  index: true,
},

tags: {
  type: [String],
  default: [],
  index: true,
},

language: {
  type: String,
  default: "English",
  index: true,
},

age_rating: {
  type: String,
  enum: ["All", "7+", "13+", "16+", "18+"],
  default: "13+",
},

    // ================= TRENDING =================

    total_views: {
      type: Number,
      default: 0,
    },

    total_reads: {
      type: Number,
      default: 0,
    },

    total_favorites: {
      type: Number,
      default: 0,
    },

    trending_score: {
      type: Number,
      default: 0,
      index: true,
    },

    last_read_at: {
      type: Date,
      default: null,
      index: true,
    },

    // ================= STATUS =================

    is_featured: {
      type: Boolean,
      default: false,
    },

    is_premium: {
      type: Boolean,
      default: false,
    },
    

    // ================= META =================

    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    collection: "comics",
  }
);

module.exports = mongoose.model("Comic", comicSchema);
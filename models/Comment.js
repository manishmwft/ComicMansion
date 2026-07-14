const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
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

    parent_comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    is_spoiler: {
      type: Boolean,
      default: false,
    },

    likes_count: {
      type: Number,
      default: 0,
    },

    replies_count: {
      type: Number,
      default: 0,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },
    user_name: {
  type: String,
  default: 'Reader',
},

user_avatar: {
  type: String,
  default: '',
},
  },
  {
    timestamps: true,
  }
);

commentSchema.index({
  episode_id: 1,
  createdAt: -1,
});

commentSchema.index({
  parent_comment_id: 1,
  createdAt: 1,
});

module.exports = mongoose.model('Comment', commentSchema);
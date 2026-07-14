const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    comment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentLikeSchema.index(
  {
    user_id: 1,
    comment_id: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('CommentLike', commentLikeSchema);
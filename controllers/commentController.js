const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const User = require('../models/User');
const {
  updateMissionProgress,
  checkAndUnlockBadges,
} = require('../utils/rewardEngine');

function getUserId(req) {
  return String(req.user.id || req.user._id);
}

exports.getEpisodeComments = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { episode_id } = req.params;

    const comments = await Comment.find({
      episode_id,
      parent_comment_id: null,
      is_deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const commentIds = comments.map((item) => item._id);

    const liked = await CommentLike.find({
      user_id: userId,
      comment_id: { $in: commentIds },
    });

    const likedSet = new Set(
      liked.map((item) => String(item.comment_id))
    );

    const result = comments.map((comment) => ({
      ...comment.toObject(),
      is_liked: likedSet.has(String(comment._id)),
    }));

    res.json({
      success: true,
      comments: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load comments',
    });
  }
};

exports.getReplies = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { comment_id } = req.params;

    const replies = await Comment.find({
      parent_comment_id: comment_id,
      is_deleted: false,
    }).sort({ createdAt: 1 });

    const replyIds = replies.map((item) => item._id);

    const liked = await CommentLike.find({
      user_id: userId,
      comment_id: { $in: replyIds },
    });

    const likedSet = new Set(
      liked.map((item) => String(item.comment_id))
    );

    const result = replies.map((reply) => ({
      ...reply.toObject(),
      is_liked: likedSet.has(String(reply._id)),
    }));

    res.json({
      success: true,
      replies: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to load replies',
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const userId = getUserId(req);

    const user = await User.findOne({ id: userId });

    const displayName =
      user?.name ||
      user?.email ||
      req.user.name ||
      req.user.email ||
      'Reader';

    const {
      comic_id,
      episode_id,
      text,
      is_spoiler = false,
      parent_comment_id = null,
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty',
      });
    }

    const comment = await Comment.create({
      user_id: userId,
      comic_id,
      episode_id,
      text: text.trim(),
      is_spoiler,
      parent_comment_id,
      user_name: displayName,
    });

    if (parent_comment_id) {
      await Comment.findByIdAndUpdate(parent_comment_id, {
        $inc: { replies_count: 1 },
      });
    }

    const completedMissions = await updateMissionProgress(
      userId,
      'post_comment',
      1
    );

    const unlockedBadges = await checkAndUnlockBadges(userId);

    res.status(201).json({
      success: true,
      comment,
      rewards: {
        completedMissions,
        unlockedBadges,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
    });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { comment_id } = req.params;

    const existing = await CommentLike.findOne({
      user_id: userId,
      comment_id,
    });

    if (existing) {
      await existing.deleteOne();

      await Comment.findByIdAndUpdate(comment_id, {
        $inc: { likes_count: -1 },
      });

      return res.json({
        success: true,
        liked: false,
      });
    }

    await CommentLike.create({
      user_id: userId,
      comment_id,
    });

    await Comment.findByIdAndUpdate(comment_id, {
      $inc: { likes_count: 1 },
    });

    await updateMissionProgress(
      userId,
      'like_comments',
      1
    );

    res.json({
      success: true,
      liked: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to like comment',
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { comment_id } = req.params;

    const comment = await Comment.findOne({
      _id: comment_id,
      user_id: userId,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.is_deleted = true;
    comment.text = 'Deleted comment';
    await comment.save();

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
    });
  }
};
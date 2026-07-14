const express = require('express');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  getEpisodeComments,
  getReplies,
  createComment,
  toggleLike,
  deleteComment,
} = require('../controllers/commentController');

router.get(
  '/episode/:episode_id',
  authMiddleware,
  getEpisodeComments
);

router.get(
  '/:comment_id/replies',
  authMiddleware,
  getReplies
);

router.post(
  '/',
  authMiddleware,
  createComment
);

router.post(
  '/:comment_id/like',
  authMiddleware,
  toggleLike
);

router.delete(
  '/:comment_id',
  authMiddleware,
  deleteComment
);

module.exports = router;
const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ['earn', 'spend'],
      required: true,
    },

    source: {
      type: String,
      enum: [
        'daily_reward',
        'mission',
        'badge',
        'episode_unlock',
        'admin',
        'referral',
      ],
      required: true,
    },

    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);
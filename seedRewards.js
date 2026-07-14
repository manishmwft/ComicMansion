const mongoose = require('mongoose');
const Badge = require('./models/Badge');
const Mission = require('./models/Mission');

require('dotenv').config();

const badges = [
  {
    key: 'first_steps',
    name: 'First Steps',
    description: 'Read your first episode',
    icon: 'book_open',
    requirement_type: 'episodes_read',
    requirement_value: 1,
    reward_xp: 25,
    reward_coins: 5,
  },
  {
    key: 'bookworm',
    name: 'Bookworm',
    description: 'Read 10 episodes',
    icon: 'book',
    requirement_type: 'episodes_read',
    requirement_value: 10,
    reward_xp: 100,
    reward_coins: 20,
  },
  {
    key: 'story_hunter',
    name: 'Story Hunter',
    description: 'Favorite 5 comics',
    icon: 'heart',
    requirement_type: 'favorites',
    requirement_value: 5,
    reward_xp: 75,
    reward_coins: 15,
  },
  {
    key: 'speed_reader',
    name: 'Speed Reader',
    description: 'Read 5 episodes in a day',
    icon: 'zap',
    requirement_type: 'episodes_read',
    requirement_value: 5,
    reward_xp: 100,
    reward_coins: 30,
  },
  {
    key: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    requirement_type: 'streak',
    requirement_value: 7,
    reward_xp: 150,
    reward_coins: 50,
  },
  {
    key: 'pro_reader',
    name: 'Pro Reader',
    description: 'Become a Pro reader',
    icon: 'crown',
    requirement_type: 'level',
    requirement_value: 5,
    reward_xp: 100,
    reward_coins: 25,
  },
  {
    key: 'comment_champion',
    name: 'Comment Champion',
    description: 'Post 20 comments',
    icon: 'message_circle',
    requirement_type: 'comments',
    requirement_value: 20,
    reward_xp: 150,
    reward_coins: 40,
  },
  {
    key: 'coin_collector',
    name: 'Coin Collector',
    description: 'Earn 500 coins',
    icon: 'coins',
    requirement_type: 'coins_earned',
    requirement_value: 500,
    reward_xp: 200,
    reward_coins: 100,
  },
];

const missions = [
  {
    key: 'daily_reader',
    title: 'Daily Reader',
    description: 'Read 1 episode today',
    mission_type: 'read_episode',
    target_count: 1,
    reward_xp: 20,
    reward_coins: 10,
    reset_type: 'daily',
  },
  {
    key: 'comment_of_the_day',
    title: 'Comment of the Day',
    description: 'Post 1 comment today',
    mission_type: 'post_comment',
    target_count: 1,
    reward_xp: 15,
    reward_coins: 5,
    reset_type: 'daily',
  },
  {
    key: 'streak_keeper',
    title: 'Streak Keeper',
    description: 'Check in for 3 days straight',
    mission_type: 'checkin',
    target_count: 3,
    reward_xp: 30,
    reward_coins: 15,
    reset_type: 'daily',
  },
  {
    key: 'episode_marathon',
    title: 'Episode Marathon',
    description: 'Read 5 episodes this week',
    mission_type: 'read_multiple',
    target_count: 5,
    reward_xp: 75,
    reward_coins: 30,
    reset_type: 'weekly',
  },
  {
    key: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Like 10 comments this week',
    mission_type: 'like_comments',
    target_count: 10,
    reward_xp: 50,
    reward_coins: 20,
    reset_type: 'weekly',
  },
  {
    key: 'new_fan',
    title: 'New Fan',
    description: 'Favorite 3 comics this week',
    mission_type: 'favorite_comics',
    target_count: 3,
    reward_xp: 60,
    reward_coins: 25,
    reset_type: 'weekly',
  },
  {
    key: 'comic_explorer',
    title: 'Comic Explorer',
    description: 'Explore 10 comics',
    mission_type: 'explore_comics',
    target_count: 10,
    reward_xp: 150,
    reward_coins: 100,
    reset_type: 'weekly',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const badge of badges) {
      await Badge.findOneAndUpdate(
        { key: badge.key },
        badge,
        { upsert: true, new: true }
      );
    }

    for (const mission of missions) {
      await Mission.findOneAndUpdate(
        { key: mission.key },
        mission,
        { upsert: true, new: true }
      );
    }

    console.log('Rewards seed completed');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
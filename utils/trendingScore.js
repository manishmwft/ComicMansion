const calculateTrendingScore = ({
  totalViews = 0,
  totalReads = 0,
  totalFavorites = 0,
  totalComments = 0,
  lastReadAt = null,
  createdAt = null,
}) => {
  const viewWeight = 1;
  const readWeight = 3;
  const favoriteWeight = 5;
  const commentWeight = 4;

  let score =
    totalViews * viewWeight +
    totalReads * readWeight +
    totalFavorites * favoriteWeight +
    totalComments * commentWeight;

  const activityDate = lastReadAt || createdAt;

  if (activityDate) {
    const ageHours =
      (Date.now() - new Date(activityDate).getTime()) / (1000 * 60 * 60);

    const freshnessBoost = Math.max(0, 100 - ageHours);

    score += freshnessBoost;
  }

  return Math.round(score);
};

module.exports = {
  calculateTrendingScore,
};
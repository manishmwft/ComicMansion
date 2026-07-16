const InAppPromotion = require("../models/InAppPromotion");
const PromotionEvent = require("../models/PromotionEvent");

const startOfDay = (date = new Date()) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const identityFilter = (req) => {
  const userId = req.user ? String(req.user.id || req.user._id) : "";
  const deviceId = String(req.headers["x-device-id"] || "").trim();

  if (!deviceId) {
    const error = new Error("X-Device-Id header is required");
    error.status = 400;
    throw error;
  }

  return {
    userId,
    deviceId,
    filter: userId ? { user_id: userId } : { device_id: deviceId },
  };
};

const audienceMatches = (promotion, req) => {
  const loggedIn = Boolean(req.user);
  const premium = Boolean(req.user?.is_premium);

  switch (promotion.target_audience) {
    case "guest": return !loggedIn;
    case "logged_in": return loggedIn;
    case "free": return loggedIn && !premium;
    case "premium": return loggedIn && premium;
    default: return true;
  }
};

const isEligible = async (promotion, req) => {
  if (!audienceMatches(promotion, req)) return false;
  if (promotion.total_impression_limit > 0 && promotion.total_impressions >= promotion.total_impression_limit) return false;

  const { filter } = identityFilter(req);
  const today = startOfDay();

  const [userDailyCount, globalDailyCount, lastImpression] = await Promise.all([
    PromotionEvent.countDocuments({
      promotion_id: promotion.id,
      event_type: "impression",
      occurred_at: { $gte: today },
      ...filter,
    }),
    promotion.global_daily_limit > 0
      ? PromotionEvent.countDocuments({
          promotion_id: promotion.id,
          event_type: "impression",
          occurred_at: { $gte: today },
        })
      : Promise.resolve(0),
    PromotionEvent.findOne({
      promotion_id: promotion.id,
      event_type: "impression",
      ...filter,
    }).sort({ occurred_at: -1 }).lean(),
  ]);

  if (userDailyCount >= promotion.per_user_daily_limit) return false;
  if (promotion.global_daily_limit > 0 && globalDailyCount >= promotion.global_daily_limit) return false;

  if (promotion.cooldown_minutes > 0 && lastImpression) {
    const nextAllowedAt = new Date(lastImpression.occurred_at).getTime() + promotion.cooldown_minutes * 60 * 1000;
    if (Date.now() < nextAllowedAt) return false;
  }

  return true;
};

exports.getStartupPromotion = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await InAppPromotion.find({
      is_active: true,
      starts_at: { $lte: now },
      ends_at: { $gte: now },
    })
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    for (const promotion of promotions) {
      if (await isEligible(promotion, req)) {
        return res.json({
          success: true,
          promotion: {
            id: promotion.id,
            title: promotion.title,
            description: promotion.description,
            image_url: promotion.image_url,
            redirect_type: promotion.redirect_type,
            redirect_value: promotion.redirect_value,
            close_delay_seconds: promotion.close_delay_seconds,
          },
        });
      }
    }

    return res.json({ success: true, promotion: null });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      detail: error.message || "Unable to load startup promotion",
    });
  }
};

exports.recordImpression = async (req, res) => {
  try {
    const promotion = await InAppPromotion.findOne({ id: req.params.id });
    if (!promotion || !promotion.is_active) {
      return res.status(404).json({ success: false, detail: "Promotion not found" });
    }

    if (!(await isEligible(promotion.toObject(), req))) {
      return res.status(409).json({ success: false, detail: "Promotion is no longer eligible" });
    }

    const { userId, deviceId } = identityFilter(req);

    await Promise.all([
      PromotionEvent.create({
        promotion_id: promotion.id,
        event_type: "impression",
        user_id: userId,
        device_id: deviceId,
        platform: String(req.headers["x-platform"] || "unknown"),
        session_id: String(req.headers["x-session-id"] || ""),
      }),
      InAppPromotion.updateOne({ id: promotion.id }, { $inc: { total_impressions: 1 } }),
    ]);

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      detail: error.message || "Unable to record promotion impression",
    });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const promotion = await InAppPromotion.findOne({ id: req.params.id }).lean();
    if (!promotion) {
      return res.status(404).json({ success: false, detail: "Promotion not found" });
    }

    const { userId, deviceId } = identityFilter(req);

    await Promise.all([
      PromotionEvent.create({
        promotion_id: promotion.id,
        event_type: "click",
        user_id: userId,
        device_id: deviceId,
        platform: String(req.headers["x-platform"] || "unknown"),
        session_id: String(req.headers["x-session-id"] || ""),
      }),
      InAppPromotion.updateOne({ id: promotion.id }, { $inc: { total_clicks: 1 } }),
    ]);

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      detail: error.message || "Unable to record promotion click",
    });
  }
};

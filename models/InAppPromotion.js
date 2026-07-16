const mongoose = require("mongoose");

const inAppPromotionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    image_url: { type: String, required: true, trim: true },
    redirect_type: {
      type: String,
      enum: ["external_url", "internal_route", "none"],
      default: "external_url",
      index: true,
    },
    redirect_value: { type: String, default: "", trim: true, maxlength: 1000 },
    starts_at: { type: Date, required: true, index: true },
    ends_at: { type: Date, required: true, index: true },
    is_active: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 10, min: 0, max: 1000, index: true },
    target_audience: {
      type: String,
      enum: ["all", "guest", "logged_in", "free", "premium"],
      default: "all",
      index: true,
    },
    per_user_daily_limit: { type: Number, default: 1, min: 1, max: 50 },
    cooldown_minutes: { type: Number, default: 720, min: 0, max: 43200 },
    global_daily_limit: { type: Number, default: 0, min: 0 },
    total_impression_limit: { type: Number, default: 0, min: 0 },
    close_delay_seconds: { type: Number, default: 0, min: 0, max: 30 },
    total_impressions: { type: Number, default: 0, min: 0 },
    total_clicks: { type: Number, default: 0, min: 0 },
    created_by: { type: String, default: "admin" },
  },
  { timestamps: true }
);

inAppPromotionSchema.index({ is_active: 1, starts_at: 1, ends_at: 1, priority: -1 });

module.exports = mongoose.model("InAppPromotion", inAppPromotionSchema);

const mongoose = require("mongoose");

const promotionEventSchema = new mongoose.Schema(
  {
    promotion_id: { type: String, required: true, index: true },
    event_type: { type: String, enum: ["impression", "click"], required: true, index: true },
    user_id: { type: String, default: "", index: true },
    device_id: { type: String, required: true, index: true },
    platform: { type: String, default: "unknown", trim: true, maxlength: 30 },
    session_id: { type: String, default: "", trim: true, maxlength: 100 },
    occurred_at: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

promotionEventSchema.index({ promotion_id: 1, device_id: 1, event_type: 1, occurred_at: -1 });
promotionEventSchema.index({ promotion_id: 1, user_id: 1, event_type: 1, occurred_at: -1 });

module.exports = mongoose.model("PromotionEvent", promotionEventSchema);

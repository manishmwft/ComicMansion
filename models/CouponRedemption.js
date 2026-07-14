const mongoose = require("mongoose");

const couponRedemptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    coupon_id: {
      type: String,
      required: true,
      index: true,
    },
    coupon_code: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    package_id: {
      type: String,
      required: true,
      index: true,
    },
    original_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    final_amount: {
      type: Number,
      required: true,
      min: 0,
    },
    bonus_coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["reserved", "redeemed", "released", "cancelled"],
      default: "reserved",
      index: true,
    },
    redeemed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "coupon_redemptions",
  }
);

couponRedemptionSchema.index({ coupon_id: 1, user_id: 1, status: 1 });

module.exports = mongoose.model("CouponRedemption", couponRedemptionSchema);

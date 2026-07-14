const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 4,
      maxlength: 30,
      match: /^[A-Z0-9_-]+$/,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    discount_type: {
      type: String,
      enum: ["percentage", "fixed_amount", "bonus_coins"],
      required: true,
    },
    discount_value: {
      type: Number,
      required: true,
      min: 0,
    },
    maximum_discount_amount: {
      type: Number,
      default: null,
      min: 0,
    },
    minimum_purchase_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicable_package_ids: {
      type: [String],
      default: [],
    },
    starts_at: {
      type: Date,
      required: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    total_usage_limit: {
      type: Number,
      default: null,
      min: 1,
    },
    usage_limit_per_user: {
      type: Number,
      default: 1,
      min: 1,
    },
    current_usage_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    campaign_name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    influencer_name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    created_by: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "coupons",
  }
);

couponSchema.index({ is_active: 1, starts_at: 1, expires_at: 1 });

module.exports = mongoose.model("Coupon", couponSchema);

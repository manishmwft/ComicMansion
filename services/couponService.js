const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");
const CoinPackage = require("../models/CoinPackage");

class CouponValidationError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "CouponValidationError";
    this.code = code;
    this.status = status;
  }
}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const normalizeCouponCode = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

const calculateCouponBenefit = ({ coupon, coinPackage }) => {
  const originalAmount = roundMoney(coinPackage.price);
  let discountAmount = 0;
  let couponBonusCoins = 0;

  if (coupon.discount_type === "percentage") {
    discountAmount = originalAmount * (coupon.discount_value / 100);

    if (coupon.maximum_discount_amount !== null) {
      discountAmount = Math.min(discountAmount, coupon.maximum_discount_amount);
    }
  } else if (coupon.discount_type === "fixed_amount") {
    discountAmount = coupon.discount_value;
  } else if (coupon.discount_type === "bonus_coins") {
    couponBonusCoins = Math.floor(coupon.discount_value);
  }

  discountAmount = roundMoney(Math.min(Math.max(discountAmount, 0), originalAmount));
  const finalAmount = roundMoney(Math.max(originalAmount - discountAmount, 0));
  const packageBonusCoins = Number(coinPackage.bonus_coins || 0);
  const baseCoins = Number(coinPackage.coins || 0);

  return {
    original_amount: originalAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    base_coins: baseCoins,
    package_bonus_coins: packageBonusCoins,
    coupon_bonus_coins: couponBonusCoins,
    total_coins: baseCoins + packageBonusCoins + couponBonusCoins,
  };
};

const validateCouponForPackage = async ({ code, packageId, userId }) => {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    throw new CouponValidationError("COUPON_CODE_REQUIRED", "Enter a coupon code");
  }

  if (!packageId) {
    throw new CouponValidationError("PACKAGE_ID_REQUIRED", "Coin package is required");
  }

  const [coupon, coinPackage] = await Promise.all([
    Coupon.findOne({ code: normalizedCode }).lean(),
    CoinPackage.findOne({ id: String(packageId), is_active: true }).lean(),
  ]);

  if (!coinPackage) {
    throw new CouponValidationError("PACKAGE_NOT_FOUND", "Coin package was not found or is inactive", 404);
  }

  if (!coupon) {
    throw new CouponValidationError("COUPON_NOT_FOUND", "Invalid coupon code", 404);
  }

  const now = new Date();

  if (!coupon.is_active) {
    throw new CouponValidationError("COUPON_INACTIVE", "This coupon is currently inactive");
  }

  if (now < new Date(coupon.starts_at)) {
    throw new CouponValidationError("COUPON_NOT_STARTED", "This coupon is not active yet");
  }

  if (now > new Date(coupon.expires_at)) {
    throw new CouponValidationError("COUPON_EXPIRED", "This coupon has expired");
  }

  if (Number(coinPackage.price) < Number(coupon.minimum_purchase_amount || 0)) {
    throw new CouponValidationError(
      "MINIMUM_PURCHASE_NOT_MET",
      `A minimum purchase of ₹${coupon.minimum_purchase_amount} is required`
    );
  }

  if (
    Array.isArray(coupon.applicable_package_ids) &&
    coupon.applicable_package_ids.length > 0 &&
    !coupon.applicable_package_ids.includes(String(packageId))
  ) {
    throw new CouponValidationError(
      "COUPON_NOT_APPLICABLE",
      "This coupon is not applicable to the selected coin package"
    );
  }

  if (
    coupon.total_usage_limit !== null &&
    Number(coupon.current_usage_count || 0) >= Number(coupon.total_usage_limit)
  ) {
    throw new CouponValidationError(
      "COUPON_USAGE_LIMIT_REACHED",
      "This coupon has reached its total usage limit"
    );
  }

  if (userId && coupon.usage_limit_per_user) {
    const userUsageCount = await CouponRedemption.countDocuments({
      coupon_id: coupon.id,
      user_id: String(userId),
      status: "redeemed",
    });

    if (userUsageCount >= Number(coupon.usage_limit_per_user)) {
      throw new CouponValidationError(
        "COUPON_USER_LIMIT_REACHED",
        "You have already used this coupon the maximum number of times"
      );
    }
  }

  const benefit = calculateCouponBenefit({ coupon, coinPackage });

  return { coupon, coinPackage, benefit };
};

module.exports = {
  CouponValidationError,
  normalizeCouponCode,
  calculateCouponBenefit,
  validateCouponForPackage,
};

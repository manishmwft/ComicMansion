const {
  CouponValidationError,
  validateCouponForPackage,
} = require("../services/couponService");

exports.validateCoupon = async (req, res) => {
  try {
    const { coupon_code, package_id } = req.body;

    const { coupon, coinPackage, benefit } = await validateCouponForPackage({
      code: coupon_code,
      packageId: package_id,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        expires_at: coupon.expires_at,
      },
      package: {
        id: coinPackage.id,
        title: coinPackage.title,
      },
      pricing: {
        original_amount: benefit.original_amount,
        discount_amount: benefit.discount_amount,
        final_amount: benefit.final_amount,
      },
      coins: {
        base_coins: benefit.base_coins,
        package_bonus_coins: benefit.package_bonus_coins,
        coupon_bonus_coins: benefit.coupon_bonus_coins,
        total_coins: benefit.total_coins,
      },
    });
  } catch (error) {
    if (error instanceof CouponValidationError) {
      return res.status(error.status).json({
        success: false,
        code: error.code,
        detail: error.message,
      });
    }

    console.error("COUPON VALIDATION ERROR:", error);

    return res.status(500).json({
      success: false,
      code: "COUPON_VALIDATION_FAILED",
      detail: "Failed to validate coupon",
    });
  }
};

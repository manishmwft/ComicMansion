const { randomUUID } = require("crypto");
const Coupon = require("../models/Coupon");
const CoinPackage = require("../models/CoinPackage");
const CouponRedemption = require("../models/CouponRedemption");
const { normalizeCouponCode } = require("../services/couponService");

const nullablePositiveNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const selectedPackageIds = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
};

const validatePayload = (payload) => {
  if (!payload.code || !/^[A-Z0-9_-]{4,30}$/.test(payload.code)) {
    return "Coupon code must be 4–30 characters using letters, numbers, underscore, or hyphen";
  }
  if (!payload.title) return "Coupon title is required";
  if (!payload.starts_at || !payload.expires_at) return "Start and expiry dates are required";
  if (payload.expires_at <= payload.starts_at) return "Expiry date must be after the start date";
  if (!(payload.discount_value > 0)) return "Discount value must be greater than zero";
  if (payload.discount_type === "percentage" && payload.discount_value > 100) {
    return "Percentage discount cannot be greater than 100";
  }
  if (payload.discount_type === "bonus_coins" && !Number.isInteger(payload.discount_value)) {
    return "Bonus coins must be a whole number";
  }
  return null;
};

const buildPayload = (body) => ({
  code: normalizeCouponCode(body.code),
  title: String(body.title || "").trim(),
  description: String(body.description || "").trim(),
  discount_type: body.discount_type,
  discount_value: Number(body.discount_value || 0),
  maximum_discount_amount:
    body.discount_type === "percentage"
      ? nullablePositiveNumber(body.maximum_discount_amount)
      : null,
  minimum_purchase_amount: Number(body.minimum_purchase_amount || 0),
  applicable_package_ids: selectedPackageIds(body.applicable_package_ids),
  starts_at: new Date(body.starts_at),
  expires_at: new Date(body.expires_at),
  total_usage_limit: nullablePositiveNumber(body.total_usage_limit),
  usage_limit_per_user: Number(body.usage_limit_per_user || 1),
  is_active: body.is_active === "true",
  campaign_name: String(body.campaign_name || "").trim(),
  influencer_name: String(body.influencer_name || "").trim(),
});

exports.index = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

    return res.render("admin/coupons/index", {
      layout: "layouts/admin",
      title: "Coupons",
      currentPath: "/admin/coupons",
      coupons,
    });
  } catch (error) {
    console.error("COUPON LIST ERROR:", error);
    req.session.error = "Failed to load coupons";
    return res.redirect("/admin/dashboard");
  }
};

exports.form = async (req, res) => {
  try {
    const [coupon, packages] = await Promise.all([
      req.params.id ? Coupon.findOne({ id: req.params.id }).lean() : Promise.resolve({}),
      CoinPackage.find().sort({ sort_order: 1, createdAt: -1 }).lean(),
    ]);

    if (req.params.id && !coupon) {
      req.session.error = "Coupon not found";
      return res.redirect("/admin/coupons");
    }

    return res.render("admin/coupons/form", {
      layout: "layouts/admin",
      title: coupon?.id ? "Edit Coupon" : "Add Coupon",
      currentPath: "/admin/coupons",
      coupon,
      packages,
    });
  } catch (error) {
    console.error("COUPON FORM ERROR:", error);
    req.session.error = "Failed to load coupon form";
    return res.redirect("/admin/coupons");
  }
};

exports.create = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      req.session.error = validationError;
      return res.redirect("/admin/coupons/add");
    }

    await Coupon.create({ id: randomUUID(), ...payload, created_by: "admin" });

    req.session.success = "Coupon created successfully";
    return res.redirect("/admin/coupons");
  } catch (error) {
    console.error("COUPON CREATE ERROR:", error);
    req.session.error = error?.code === 11000 ? "Coupon code already exists" : "Failed to create coupon";
    return res.redirect("/admin/coupons/add");
  }
};

exports.update = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      req.session.error = validationError;
      return res.redirect(`/admin/coupons/edit/${req.params.id}`);
    }

    const result = await Coupon.updateOne({ id: req.params.id }, payload);
    if (!result.matchedCount) {
      req.session.error = "Coupon not found";
      return res.redirect("/admin/coupons");
    }

    req.session.success = "Coupon updated successfully";
    return res.redirect("/admin/coupons");
  } catch (error) {
    console.error("COUPON UPDATE ERROR:", error);
    req.session.error = error?.code === 11000 ? "Coupon code already exists" : "Failed to update coupon";
    return res.redirect(`/admin/coupons/edit/${req.params.id}`);
  }
};

exports.toggle = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ id: req.params.id });
    if (!coupon) {
      req.session.error = "Coupon not found";
      return res.redirect("/admin/coupons");
    }

    coupon.is_active = !coupon.is_active;
    await coupon.save();

    req.session.success = `Coupon ${coupon.is_active ? "activated" : "deactivated"}`;
    return res.redirect("/admin/coupons");
  } catch (error) {
    console.error("COUPON TOGGLE ERROR:", error);
    req.session.error = "Failed to update coupon status";
    return res.redirect("/admin/coupons");
  }
};

exports.redemptions = async (req, res) => {
  try {
    const [coupon, redemptions] = await Promise.all([
      Coupon.findOne({ id: req.params.id }).lean(),
      CouponRedemption.find({ coupon_id: req.params.id }).sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    if (!coupon) {
      req.session.error = "Coupon not found";
      return res.redirect("/admin/coupons");
    }

    return res.render("admin/coupons/redemptions", {
      layout: "layouts/admin",
      title: `${coupon.code} Redemptions`,
      currentPath: "/admin/coupons",
      coupon,
      redemptions,
    });
  } catch (error) {
    console.error("COUPON REDEMPTIONS ERROR:", error);
    req.session.error = "Failed to load coupon redemptions";
    return res.redirect("/admin/coupons");
  }
};

const { randomUUID } = require("crypto");
const InAppPromotion = require("../models/InAppPromotion");
const PromotionEvent = require("../models/PromotionEvent");

const dateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildPayload = (req, existing = null) => ({
  title: String(req.body.title || "").trim(),
  description: String(req.body.description || "").trim(),
  image_url: req.file
    ? `/uploads/promotions/${req.file.filename}`
    : String(existing?.image_url || ""),
  redirect_type: req.body.redirect_type || "external_url",
  redirect_value: String(req.body.redirect_value || "").trim(),
  starts_at: dateValue(req.body.starts_at),
  ends_at: dateValue(req.body.ends_at),
  is_active: req.body.is_active === "true",
  priority: Number(req.body.priority || 10),
  target_audience: req.body.target_audience || "all",
  per_user_daily_limit: Number(req.body.per_user_daily_limit || 1),
  cooldown_minutes: Number(req.body.cooldown_minutes || 720),
  global_daily_limit: Number(req.body.global_daily_limit || 0),
  total_impression_limit: Number(req.body.total_impression_limit || 0),
  close_delay_seconds: Number(req.body.close_delay_seconds || 0),
});

const validate = (payload) => {
  if (!payload.title) return "Promotion title is required";
  if (!payload.image_url) return "Promotion image is required";
  if (!payload.starts_at || !payload.ends_at) return "Start and end dates are required";
  if (payload.ends_at <= payload.starts_at) return "End date must be after start date";
  if (payload.redirect_type !== "none" && !payload.redirect_value) return "Redirect destination is required";
  return null;
};

exports.index = async (req, res) => {
  try {
    const promotions = await InAppPromotion.find().sort({ createdAt: -1 }).lean();
    return res.render("admin/promotions/index", {
      layout: "layouts/admin",
      title: "In-App Promotions",
      currentPath: "/admin/promotions",
      promotions,
    });
  } catch (error) {
    console.error("PROMOTION LIST ERROR:", error);
    req.session.error = "Failed to load promotions";
    return res.redirect("/admin/dashboard");
  }
};

exports.form = async (req, res) => {
  try {
    const promotion = req.params.id
      ? await InAppPromotion.findOne({ id: req.params.id }).lean()
      : {};

    if (req.params.id && !promotion) {
      req.session.error = "Promotion not found";
      return res.redirect("/admin/promotions");
    }

    return res.render("admin/promotions/form", {
      layout: "layouts/admin",
      title: promotion?.id ? "Edit Promotion" : "Add Promotion",
      currentPath: "/admin/promotions",
      promotion,
    });
  } catch (error) {
    req.session.error = "Failed to load promotion form";
    return res.redirect("/admin/promotions");
  }
};

exports.create = async (req, res) => {
  try {
    const payload = buildPayload(req);
    const validationError = validate(payload);
    if (validationError) {
      req.session.error = validationError;
      return res.redirect("/admin/promotions/add");
    }

    await InAppPromotion.create({ id: randomUUID(), ...payload });
    req.session.success = "Promotion created successfully";
    return res.redirect("/admin/promotions");
  } catch (error) {
    console.error("PROMOTION CREATE ERROR:", error);
    req.session.error = "Failed to create promotion";
    return res.redirect("/admin/promotions/add");
  }
};

exports.update = async (req, res) => {
  try {
    const existing = await InAppPromotion.findOne({ id: req.params.id }).lean();
    if (!existing) {
      req.session.error = "Promotion not found";
      return res.redirect("/admin/promotions");
    }

    const payload = buildPayload(req, existing);
    const validationError = validate(payload);
    if (validationError) {
      req.session.error = validationError;
      return res.redirect(`/admin/promotions/edit/${req.params.id}`);
    }

    await InAppPromotion.updateOne({ id: req.params.id }, payload);
    req.session.success = "Promotion updated successfully";
    return res.redirect("/admin/promotions");
  } catch (error) {
    console.error("PROMOTION UPDATE ERROR:", error);
    req.session.error = "Failed to update promotion";
    return res.redirect(`/admin/promotions/edit/${req.params.id}`);
  }
};

exports.toggle = async (req, res) => {
  const promotion = await InAppPromotion.findOne({ id: req.params.id });
  if (!promotion) {
    req.session.error = "Promotion not found";
    return res.redirect("/admin/promotions");
  }
  promotion.is_active = !promotion.is_active;
  await promotion.save();
  req.session.success = `Promotion ${promotion.is_active ? "activated" : "deactivated"}`;
  return res.redirect("/admin/promotions");
};

exports.analytics = async (req, res) => {
  try {
    const promotion = await InAppPromotion.findOne({ id: req.params.id }).lean();
    if (!promotion) {
      req.session.error = "Promotion not found";
      return res.redirect("/admin/promotions");
    }

    const events = await PromotionEvent.find({ promotion_id: promotion.id })
      .sort({ occurred_at: -1 })
      .limit(500)
      .lean();

    return res.render("admin/promotions/analytics", {
      layout: "layouts/admin",
      title: `${promotion.title} Analytics`,
      currentPath: "/admin/promotions",
      promotion,
      events,
    });
  } catch (error) {
    req.session.error = "Failed to load promotion analytics";
    return res.redirect("/admin/promotions");
  }
};

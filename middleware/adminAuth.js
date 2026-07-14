const adminAuth = (req, res, next) => {
  if (!req.session || !req.session.admin || req.session.admin.logged_in !== true) {
    return res.redirect("/admin/login");
  }

  res.locals.adminEmail = req.session.admin.email || "";

  next();
};

module.exports = adminAuth;
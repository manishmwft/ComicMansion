const bcrypt = require("bcryptjs");

const getAdminEmail = () => {
  return process.env.ADMIN_EMAIL;
};

const getAdminPasswordHash = () => {
  return process.env.ADMIN_PASSWORD_HASH;
};

exports.loginPage = (req, res) => {
  res.render("admin/login", {
    layout: false,
    error: null,
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const inputEmail = String(email || "").trim().toLowerCase();
    const inputPassword = String(password || "").trim();

    const adminEmail = String(getAdminEmail() || "").trim().toLowerCase();
    const adminPasswordHash = String(getAdminPasswordHash() || "").trim();

    // console.log("========== ADMIN LOGIN DEBUG ==========");
    // console.log("ADMIN_EMAIL ENV:", adminEmail);
    // console.log("INPUT EMAIL:", inputEmail);
    // console.log("HASH START:", adminPasswordHash.substring(0, 7));
    // console.log("HASH LENGTH:", adminPasswordHash.length);
    // console.log("PASSWORD:", inputPassword);
    // console.log("=======================================");

    if (!adminEmail || !adminPasswordHash) {
      return res.render("admin/login", {
        layout: false,
        error: "Admin auth is not configured",
      });
    }

    if (inputEmail !== adminEmail) {
      console.log("ADMIN LOGIN FAILED: Email mismatch");

      return res.render("admin/login", {
        layout: false,
        error: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(
      inputPassword,
      adminPasswordHash
    );

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      console.log("ADMIN LOGIN FAILED: Password mismatch");

      return res.render("admin/login", {
        layout: false,
        error: "Invalid credentials",
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.log("ADMIN LOGIN FAILED: Session regenerate error", err);

        return res.render("admin/login", {
          layout: false,
          error: "Session error. Please try again.",
        });
      }

      req.session.admin = {
        email: adminEmail,
        logged_in: true,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          console.log("ADMIN LOGIN FAILED: Session save error", saveErr);

          return res.render("admin/login", {
            layout: false,
            error: "Session save error. Please try again.",
          });
        }

        console.log("ADMIN LOGIN SUCCESS:", adminEmail);

        return res.redirect("/admin/dashboard");
      });
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.render("admin/login", {
      layout: false,
      error: "Login failed",
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("bharat_admin_session");
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
};
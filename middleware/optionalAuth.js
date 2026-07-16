const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return next();

    const token = header.slice(7).trim();
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type && payload.type !== "access") return next();

    const userId = payload.user_id || payload.id;
    const user = await User.findOne({ id: Number(userId) }).lean();
    if (!user) return next();

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      is_premium: Boolean(user.is_premium),
    };
  } catch (_) {
    // Optional auth intentionally ignores invalid or expired tokens.
  }

  return next();
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        detail: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.type && payload.type !== "access") {
      return res.status(401).json({
        success: false,
        detail: "Invalid token type",
      });
    }

    const userId = payload.user_id || payload.id;

    const user = await User.findOne({ id: Number(userId) });

    if (!user) {
      return res.status(401).json({
        success: false,
        detail: "Invalid user",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      is_premium: user.is_premium || false,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      detail: "Could not validate credentials",
    });
  }
};

module.exports = authMiddleware;
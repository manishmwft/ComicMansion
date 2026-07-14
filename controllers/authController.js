const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

const hashPassword = async (password) => {
  return bcrypt.hash(String(password).slice(0, 72), 12);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(String(plainPassword), hashedPassword);
};

const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

const sanitizeUser = (user) => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    is_premium: user.is_premium || false,
  };
};

const createAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      is_premium: user.is_premium || false,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      algorithm: process.env.JWT_ALGORITHM || "HS256",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

const createRefreshTokenValue = () => {
  return crypto.randomBytes(64).toString("hex");
};

const createRefreshToken = async ({
  userId,
  deviceId = "",
  platform = "unknown",
}) => {
  const token = createRefreshTokenValue();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

  await RefreshToken.create({
    user_id: String(userId),
    token,
    device_id: String(deviceId || ""),
    platform,
    expires_at: expiresAt,
  });

  return token;
};

const buildAuthResponse = async (user, req) => {
  const accessToken = createAccessToken(user);

  const refreshToken = await createRefreshToken({
    userId: user.id,
    deviceId: req.body.device_id || "",
    platform: req.body.platform || "unknown",
  });

  return {
    access_token: accessToken,
    accessToken,
    refresh_token: refreshToken,
    refreshToken,
    token_type: "bearer",
    expires_in: ACCESS_TOKEN_EXPIRES_IN,
    user: sanitizeUser(user),
  };
};

const register = async (req, res) => {
  try {
    const { password, name } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        detail: "Name, email and password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        detail: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        detail: "User already exists",
      });
    }

    const lastUser = await User.findOne().sort({ id: -1 });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    const newUser = await User.create({
      id: nextId,
      email,
      name: String(name).trim(),
      password: await hashPassword(password),
      is_premium: false,
    });

    const authData = await buildAuthResponse(newUser, req);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      ...authData,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      detail: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        detail: "Email and password are required",
      });
    }

    const dbUser = await User.findOne({ email });

    if (!dbUser || !(await verifyPassword(password, dbUser.password))) {
      return res.status(401).json({
        success: false,
        detail: "Invalid credentials",
      });
    }

    const authData = await buildAuthResponse(dbUser, req);

    return res.json({
      success: true,
      message: "Login successful",
      ...authData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      detail: "Login failed",
    });
  }
};

const refresh = async (req, res) => {
  try {
    const { refresh_token, refreshToken } = req.body;
    const tokenValue = refresh_token || refreshToken;

    if (!tokenValue) {
      return res.status(400).json({
        success: false,
        detail: "Refresh token is required",
      });
    }

    const storedToken = await RefreshToken.findOne({
      token: tokenValue,
      is_revoked: false,
    });

    if (!storedToken || storedToken.expires_at < new Date()) {
      return res.status(401).json({
        success: false,
        detail: "Invalid or expired refresh token",
      });
    }

    const user = await User.findOne({
      id: Number(storedToken.user_id),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        detail: "User not found",
      });
    }

    storedToken.is_revoked = true;
    storedToken.revoked_at = new Date();
    await storedToken.save();

    const accessToken = createAccessToken(user);

    const newRefreshToken = await createRefreshToken({
      userId: user.id,
      deviceId: storedToken.device_id,
      platform: storedToken.platform,
    });

    return res.json({
      success: true,
      access_token: accessToken,
      accessToken,
      refresh_token: newRefreshToken,
      refreshToken: newRefreshToken,
      token_type: "bearer",
      expires_in: ACCESS_TOKEN_EXPIRES_IN,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      detail: "Token refresh failed",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refresh_token, refreshToken } = req.body;
    const tokenValue = refresh_token || refreshToken;

    if (tokenValue) {
      await RefreshToken.findOneAndUpdate(
        { token: tokenValue },
        {
          is_revoked: true,
          revoked_at: new Date(),
        }
      );
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      detail: "Logout failed",
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        detail: "User not found",
      });
    }

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      success: false,
      detail: "Failed to fetch user",
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
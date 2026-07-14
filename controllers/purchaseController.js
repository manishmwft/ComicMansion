const { randomUUID } = require("crypto");
const Purchase = require("../models/Purchase");

const createPurchase = async (req, res) => {
  try {
    const { user_id, episode_id } = req.body;

    const existing = await Purchase.findOne({ user_id, episode_id });

    if (!existing) {
      await Purchase.create({
        id: randomUUID(),
        user_id,
        episode_id,
      });
    }

    return res.json({ msg: "unlocked" });
  } catch (error) {
    return res.status(500).json({ detail: error.message });
  }
};

module.exports = { createPurchase };
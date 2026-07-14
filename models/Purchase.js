const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: Number,
      required: true,
      index: true,
    },
    episode_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    versionKey: false,
    collection: "purchases",
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({

  githubId: { type: String, unique: true },

  username: {type: String},

  email: {type: String},

  avatar_url: {type: String},

  role: { type: String, enum: ["analyst", "admin"], default: "analyst" },

  is_active: { type: Boolean, default: true },

  last_login_at: {type: Date}

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
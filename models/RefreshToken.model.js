const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema({

  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},

  token: {type: String},

  revoked: { type: Boolean, default: false },

  expiresAt: {type: Date}

});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
// backend/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    avatar: { type: String, default: '' },
    // Incrementato per revocare i refresh token esistenti (es. cambio password).
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Oggetto “pulito” da mandare al frontend
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    email: this.email,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
  };
};

module.exports = mongoose.model('User', userSchema);

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
  };
};

module.exports = mongoose.model('User', userSchema);

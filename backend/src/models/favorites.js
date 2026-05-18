// backend/src/models/favorites.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    name: String,
    image: String,
    date: String,
    venue: String,
    city: String,
    url: String,
  },
  {
    timestamps: true,
  }
);

// Evita duplicati dello stesso evento per lo stesso utente
favoriteSchema.index({ user: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

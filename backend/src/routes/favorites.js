const express = require('express');
const auth = require('../middleware/auth');
const Favorite = require('../models/favorites');

const router = express.Router();

// GET /api/favorites
router.get('/', auth, async (req, res, next) => {
  try {
    const items = await Favorite.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/favorites
router.post('/', auth, async (req, res, next) => {
  try {
    const { eventId, name, image, date, venue, city, url, genre } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId è obbligatorio.' });
    }

    const fav = await Favorite.findOneAndUpdate(
      { user: req.user.id, eventId },
      {
        $set: { name, image, date, venue, city, url, genre },
        $setOnInsert: { user: req.user.id, eventId },
      },
      { new: true, upsert: true }
    );

    res.status(201).json(fav);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/favorites/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await Favorite.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Preferito non trovato.' });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

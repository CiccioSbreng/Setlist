// backend/src/routes/favorites.js
const express = require('express');
const auth = require('../middleware/auth');
const Favorite = require('../models/favorites');

const router = express.Router();

// GET /api/favorites  → lista preferiti dell'utente loggato
router.get('/', auth, async (req, res) => {
  try {
    const items = await Favorite.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ message: 'Errore nel recupero dei preferiti.' });
  }
});

// POST /api/favorites  → aggiunge o aggiorna un preferito
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, name, image, date, venue, city, url } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId è obbligatorio.' });
    }

    const fav = await Favorite.findOneAndUpdate(
      { user: req.user.id, eventId }, // filtro
      {
        $set: { name, image, date, venue, city, url },       // aggiorna questi campi
        $setOnInsert: { user: req.user.id, eventId },        // solo se il documento è nuovo
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(201).json(fav);
  } catch (err) {
    console.error('Create favorite error:', err);
    res.status(500).json({ message: 'Errore nel salvataggio del preferito.' });
  }
});

// DELETE /api/favorites/:id  → rimuove un preferito per _id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Preferito non trovato.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete favorite error:', err);
    res.status(500).json({ message: 'Errore nella rimozione del preferito.' });
  }
});

module.exports = router;

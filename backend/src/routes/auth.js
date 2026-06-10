// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../lib/tokens');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || !password || password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Email valida e password (min 6 caratteri) sono obbligatori.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Esiste già un account con questa email.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ email, passwordHash });
    const token        = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({
      token,
      refreshToken,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email e password sono obbligatorie.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const token        = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      token,
      refreshToken,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utente non trovato.' });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { displayName, bio, avatar } = req.body;
    const update = {};
    if (displayName !== undefined) update.displayName = String(displayName).slice(0, 60);
    if (bio !== undefined) update.bio = String(bio).slice(0, 200);
    if (avatar !== undefined) update.avatar = String(avatar).slice(0, 500);
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'Utente non trovato.' });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password non valida (min 6 caratteri).' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utente non trovato.' });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Password attuale errata.' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Cambio password: invalida tutti i refresh token esistenti (altri device).
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken mancante.' });

  try {
    const payload = verifyRefreshToken(refreshToken);

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Utente non trovato.' });

    // Revoca: se il tokenVersion non combacia, il refresh è stato invalidato.
    if ((payload.tv ?? 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Sessione scaduta. Effettua di nuovo l\'accesso.' });
    }

    const token      = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    return res.json({ token, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Token non valido.' });
  }
});

module.exports = router;

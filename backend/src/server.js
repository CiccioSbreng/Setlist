// backend/src/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Router Ticketmaster
const ticketmasterRouter = require('./routes/ticketmaster');
// Routers Auth & Favorites
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');

const app = express();

// siamo dietro a un proxy (Render), utile per rate-limit ecc.
app.set('trust proxy', 1);

// Middleware base
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// ✅ CORS aperto: locale + Render + qualunque origin
app.use(cors());

// Rate limit per tutte le API
app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 60,
  })
);

// Monta le rotte
app.use('/api/ticketmaster', ticketmasterRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);

// rotta diagnostica
app.get('/__ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/concerthub';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connesso');
  } catch (err) {
    console.error('⚠️ Impossibile connettersi a MongoDB, avvio API senza DB');
    console.error(err.message);  // <-- log dell'errore vero
  }

  app.listen(PORT, () => {
    console.log(`🚀 ConcertHub API in ascolto su http://localhost:${PORT}`);
  });
}

start();

// backend/src/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Validazione env vars critiche all'avvio
const REQUIRED_VARS = ['TICKETMASTER_API_KEY', 'JWT_SECRET'];
const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Variabili d'ambiente mancanti: ${missing.join(', ')}`);
  process.exit(1);
}
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  console.warn('⚠️  SPOTIFY_CLIENT_ID/SECRET non configurati: endpoint Spotify disabilitato');
}
if (!process.env.YOUTUBE_API_KEY) {
  console.warn('⚠️  YOUTUBE_API_KEY non configurata: endpoint YouTube disabilitato');
}

const ticketmasterRouter = require('./routes/ticketmaster');
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');
const youtubeRouter = require('./routes/youtube');
const spotifyRouter = require('./routes/spotify');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS: consente localhost in dev e il dominio di produzione
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Permette richieste senza origin (curl, Postman, SSR)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin non consentita — ${origin}`));
    },
    credentials: true,
  })
);

app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: 60,
  })
);

app.use('/api/ticketmaster', ticketmasterRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/spotify', spotifyRouter);

app.get('/__ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/concerthub';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connesso');
  } catch (err) {
    console.error('⚠️ MongoDB non raggiungibile, avvio senza DB');
    console.error(err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 ConcertHub API → http://localhost:${PORT}`);
  });
}

start();

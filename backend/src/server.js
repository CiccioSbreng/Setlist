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

const ticketmasterRouter = require('./routes/ticketmaster');
const authRouter = require('./routes/auth');
const favoritesRouter = require('./routes/favorites');
const youtubeRouter = require('./routes/youtube');
const spotifyRouter = require('./routes/spotify');
const weatherRouter = require('./routes/weather');
const setlistRouter = require('./routes/setlist');
const distanceRouter = require('./routes/distance');

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
app.use('/api/weather', weatherRouter);
app.use('/api/setlist', setlistRouter);
app.use('/api/distance', distanceRouter);

app.get('/__ping', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/concerthub';

function printBanner({ port, dbOk }) {
  const tty = process.stdout.isTTY;
  const C = tty
    ? {
        bar: '\x1b[38;5;208m',
        title: '\x1b[1m\x1b[38;5;208m',
        key: '\x1b[2m',
        ok: '\x1b[32m',
        warn: '\x1b[33m',
        reset: '\x1b[0m',
      }
    : { bar: '', title: '', key: '', ok: '', warn: '', reset: '' };

  const env = process.env.NODE_ENV || 'development';
  const flag = (on) =>
    on ? `${C.ok}attivo${C.reset}` : `${C.warn}non configurato${C.reset}`;
  const row = (k, v) =>
    `  ${C.bar}▌${C.reset}  ${C.key}${k.padEnd(13)}${C.reset}${v}`;

  console.log(
    [
      '',
      `  ${C.bar}▌${C.reset}  ${C.title}ConcertHub API${C.reset}`,
      `  ${C.bar}▌${C.reset}`,
      row('Ambiente', env),
      row('URL', `http://localhost:${port}`),
      row(
        'MongoDB',
        dbOk ? `${C.ok}connesso${C.reset}` : `${C.warn}offline${C.reset}`
      ),
      row('Ticketmaster', `${C.ok}attivo${C.reset}`),
      row(
        'Spotify',
        flag(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
      ),
      row('YouTube', flag(process.env.YOUTUBE_API_KEY)),
      '',
    ].join('\n')
  );
}

async function start() {
  let dbOk = false;
  try {
    await mongoose.connect(MONGO_URI);
    dbOk = true;
  } catch (err) {
    console.error(`MongoDB non raggiungibile, avvio senza DB (${err.message})`);
  }

  app.listen(PORT, () => printBanner({ port: PORT, dbOk }));
}

start();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { runChecks } = require('./lib/health');

// Variabili critiche: blocca l'avvio se mancanti
const REQUIRED_VARS = ['TICKETMASTER_API_KEY', 'JWT_SECRET'];
const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Variabili d'ambiente mancanti: ${missing.join(', ')}`);
  process.exit(1);
}

const ticketmasterRouter = require('./routes/ticketmaster');
const authRouter         = require('./routes/auth');
const favoritesRouter    = require('./routes/favorites');
const youtubeRouter      = require('./routes/youtube');
const spotifyRouter      = require('./routes/spotify');
const weatherRouter      = require('./routes/weather');
const setlistRouter      = require('./routes/setlist');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin non consentita — ${origin}`));
  },
  credentials: true,
}));

app.use('/api/', rateLimit({ windowMs: 60_000, max: 60 }));

app.use('/api/ticketmaster', ticketmasterRouter);
app.use('/api/auth',         authRouter);
app.use('/api/favorites',    favoritesRouter);
app.use('/api/youtube',      youtubeRouter);
app.use('/api/spotify',      spotifyRouter);
app.use('/api/weather',      weatherRouter);
app.use('/api/setlist',      setlistRouter);

app.get('/__ping', (_req, res) => res.json({ ok: true }));

// ── Banner e diagnostica ────────────────────────────────────────────

const PORT     = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/concerthub';

function colors() {
  const tty = process.stdout.isTTY;
  return tty
    ? { bar: '\x1b[38;5;208m', title: '\x1b[1m\x1b[38;5;208m',
        dim: '\x1b[2m', ok: '\x1b[32m', warn: '\x1b[33m',
        err: '\x1b[31m', reset: '\x1b[0m' }
    : { bar: '', title: '', dim: '', ok: '', warn: '', err: '', reset: '' };
}

function printBanner({ port, dbOk }) {
  const C = colors();
  const row = (k, v) => `  ${C.bar}▌${C.reset}  ${C.dim}${k.padEnd(10)}${C.reset}${v}`;
  const db  = dbOk
    ? `${C.ok}✓  connesso${C.reset}`
    : `${C.warn}✗  offline${C.reset}`;

  console.log([
    '',
    `  ${C.bar}▌${C.reset}  ${C.title}ConcertHub API${C.reset}`,
    `  ${C.bar}▌${C.reset}`,
    row('Ambiente', process.env.NODE_ENV || 'development'),
    row('URL',      `http://localhost:${port}`),
    row('MongoDB',  db),
    `  ${C.bar}▌${C.reset}`,
    `  ${C.bar}▌${C.reset}  ${C.dim}Verifica servizi in corso…${C.reset}`,
    '',
  ].join('\n'));
}

function printServices(results) {
  const C = colors();
  const row = (k, v) => `  ${C.bar}▌${C.reset}  ${C.dim}${k.padEnd(13)}${C.reset}${v}`;

  const lines = results.map(({ name, configured, ok, detail }) => {
    let status;
    if (!configured)    status = `${C.warn}—  non configurato${C.reset}`;
    else if (ok)        status = `${C.ok}✓  pronto${C.reset}`;
    else                status = `${C.err}✗  ${detail || 'errore'}${C.reset}`;
    return row(name, status);
  });

  console.log([
    `  ${C.bar}▌${C.reset}  ${C.dim}Servizi esterni${C.reset}`,
    ...lines,
    '',
  ].join('\n'));
}

// ── Avvio ───────────────────────────────────────────────────────────

async function start() {
  let dbOk = false;
  try {
    await mongoose.connect(MONGO_URI);
    dbOk = true;
  } catch (err) {
    console.error(`MongoDB non raggiungibile: ${err.message}`);
  }

  app.listen(PORT, () => {
    printBanner({ port: PORT, dbOk });
    // Probe asincrono: non blocca l'avvio, risultati dopo max 5s
    runChecks().then(printServices).catch(() => {});
  });
}

start();

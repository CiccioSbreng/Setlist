const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const logger = require('./lib/logger');
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

// In produzione MONGO_URI è obbligatoria: meglio fallire subito che connettersi
// silenziosamente a un localhost inesistente. In sviluppo resta il default locale.
if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI) {
  console.error("❌ MONGO_URI è obbligatoria in produzione.");
  process.exit(1);
}

const ticketmasterRouter = require('./routes/ticketmaster');
const authRouter         = require('./routes/auth');
const favoritesRouter    = require('./routes/favorites');
const youtubeRouter      = require('./routes/youtube');
const spotifyRouter      = require('./routes/spotify');
const weatherRouter      = require('./routes/weather');
const setlistRouter      = require('./routes/setlist');
const errorHandler       = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
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

// Limite più stretto sugli endpoint sensibili di autenticazione (anti brute-force):
// max 15 tentativi ogni 15 minuti per IP su login e registrazione.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Troppi tentativi. Riprova tra qualche minuto.' },
});
app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

// Blocca le route che richiedono DB se Mongoose non è connesso
const DB_ROUTES = ['/api/auth', '/api/favorites'];
app.use((req, res, next) => {
  if (DB_ROUTES.some((r) => req.path.startsWith(r)) && mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database non disponibile. Riprova tra poco.' });
  }
  next();
});

app.use('/api/ticketmaster', ticketmasterRouter);
app.use('/api/auth',         authRouter);
app.use('/api/favorites',    favoritesRouter);
app.use('/api/youtube',      youtubeRouter);
app.use('/api/spotify',      spotifyRouter);
app.use('/api/weather',      weatherRouter);
app.use('/api/setlist',      setlistRouter);

app.get('/__ping', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

// ── Banner e diagnostica ────────────────────────────────────────────

const PORT     = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/setlist';

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
    `  ${C.bar}▌${C.reset}  ${C.title}Setlist API${C.reset}`,
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
    logger.error(`MongoDB non raggiungibile: ${err.message}`);
  }

  app.listen(PORT, () => {
    printBanner({ port: PORT, dbOk });
    // Probe asincrono: non blocca l'avvio, risultati dopo max 5s
    runChecks().then(printServices).catch(() => {});
  });
}

start();

// backend/src/lib/tokens.js
// Gestione centralizzata dei JWT: access token e refresh token.
const jwt = require('jsonwebtoken');

const ACCESS_TTL  = '1h';
const REFRESH_TTL = '30d';

// Secret separato per i refresh token se configurato, altrimenti si usa JWT_SECRET
// (retro-compatibile: i token già emessi continuano a verificarsi).
function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString(), type: 'refresh', tv: user.tokenVersion || 0 },
    refreshSecret(),
    { expiresIn: REFRESH_TTL }
  );
}

// Verifica un access token. Rifiuta esplicitamente i refresh token: un refresh
// (valido 30 giorni) NON deve poter essere usato come Bearer per le API.
function verifyAccessToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.type === 'refresh') {
    throw new Error('refresh token non valido come access token');
  }
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret());
  if (payload.type !== 'refresh') {
    throw new Error('non è un refresh token');
  }
  return payload;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

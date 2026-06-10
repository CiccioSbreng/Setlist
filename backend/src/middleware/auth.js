// backend/src/middleware/auth.js
const logger = require('../lib/logger');
const { verifyAccessToken } = require('../lib/tokens');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token mancante' });
  }

  const token = header.split(' ')[1];

  try {
    req.user = verifyAccessToken(token); // { id, email, type: 'access' }
    next();
  } catch (err) {
    logger.warn(`JWT non valido: ${err.message}`);
    return res.status(401).json({ message: 'Token non valido' });
  }
};

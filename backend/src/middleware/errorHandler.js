const logger = require('../lib/logger');
const isProd = process.env.NODE_ENV === 'production';

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  // Mongoose: documento non trovato
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Risorsa non trovata.' });
  }

  // Mongoose: campo unique duplicato
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Esiste già una risorsa con questi dati.' });
  }

  // Mongoose: validazione schema
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // JWT: token malformato o scaduto
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token non valido o scaduto.' });
  }

  // CORS: origin non consentita
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }

  const status = err.status || err.statusCode || 500;

  logger.error({ message: err.message, status, stack: err.stack, url: req.originalUrl });

  res.status(status).json({
    message: isProd && status === 500
      ? 'Errore interno del server.'
      : (err.message || 'Errore interno del server.'),
    ...(isProd ? {} : { stack: err.stack }),
  });
};

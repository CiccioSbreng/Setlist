const { createLogger, format, transports } = require('winston');

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd
    ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
    : format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

module.exports = logger;

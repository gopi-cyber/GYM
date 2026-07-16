// Rate limiting middleware to prevent abuse and brute-force attacks.
// Keep rules narrow and tuned; never lock legitimate users behind a one-size cap.
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: 'API rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  globalApiLimiter,
};

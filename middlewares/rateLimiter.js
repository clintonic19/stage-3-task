const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 9,
  keyGenerator: () => 'auth-github',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ status: 'error', message: 'Too many requests, try again later' }),
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ status: 'error', message: 'Rate limit exceeded' }),
});

module.exports = { authLimiter, apiLimiter };

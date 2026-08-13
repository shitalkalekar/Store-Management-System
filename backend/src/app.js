const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const env = require('./config/env');

const app = express();
if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY === 'true' ? 1 : env.TRUST_PROXY);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Internal-Token', 'X-Request-Id'],
  maxAge: 600,
}));

app.use(express.json({ limit: '1mb', strict: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'tiny'));

// A number of legacy controllers build their own 500 responses. Ensure none of
// those responses expose database or provider error details in production.
app.use((_req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (env.NODE_ENV === 'production' && res.statusCode >= 500) {
      return sendJson({ error: 'Internal server error' });
    }
    return sendJson(body);
  };
  next();
});

const rejectDangerousKeys = (value) => {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(rejectDangerousKeys);
  return Object.entries(value).some(([key, child]) =>
    key.startsWith('$') || key.includes('.') || ['__proto__', 'prototype', 'constructor'].includes(key) || rejectDangerousKeys(child)
  );
};

app.use((req, res, next) => {
  if (rejectDangerousKeys(req.body) || rejectDangerousKeys(req.query)) {
    return res.status(400).json({ error: 'Invalid request structure' });
  }
  return next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests; try again later' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts; try again later' },
});
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many payment requests; try again later' },
});

app.use('/result-analysis', apiLimiter);
app.use('/result-analysis/auth/login', authLimiter);
app.use('/result-analysis/auth/customer/login', authLimiter);
app.use('/result-analysis/payments', paymentLimiter);

// public health check (used by service-discovery)
app.get('/health', (_req, res) => res.json({ ok: true, module: 'result-analysis' }));

// all real routes are gateway-only and tenant/context aware
app.use('/result-analysis', routes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error('[result-analysis]', err.message);
  const status = err.status || 500;
  const message = status >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Server error');
  res.status(status).json({ error: message });
});

module.exports = app;

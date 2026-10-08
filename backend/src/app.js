const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const registrations = require('./routes/registrations');
const teams = require('./routes/teams');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/registrations', rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api', registrations);
app.use('/api', teams);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

module.exports = app;

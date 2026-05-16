const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const goalsRoutes       = require('./routes/goals');
const achievementsRoutes = require('./routes/achievements');
const reportsRoutes     = require('./routes/reports');
const auditLogRoutes    = require('./routes/auditLog');

const app = express();

// ─── FIX 1: CORS ────────────────────────────────────────────────────────────
// Allow the React dev server (3000) and any deployed frontend URL.
// FRONTEND_URL is set in .env for production; falls back to localhost for dev.
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL, // e.g. https://atomquest.vercel.app
].filter(Boolean); // remove undefined if FRONTEND_URL not set

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Preflight — browsers send OPTIONS before POST/PUT with custom headers.
// Must respond 200 before the real request is attempted.
app.options('*', cors());

app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'UP' }));
app.use('/api/auth',        authRoutes);
app.use('/api/goals',       goalsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/reports',     reportsRoutes);
app.use('/api/audit-log',   auditLogRoutes);

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches synchronous throws and next(err) calls from any route.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));

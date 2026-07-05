const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/pool');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categories');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Configure CORS to only allow requests from the deployed frontend or localhost
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());

// --------------- Routes ---------------

// Auth routes (signup, login, me)
app.use('/api/auth', authRoutes);

// Category CRUD (protected)
app.use('/api/categories', categoryRoutes);

// Transaction CRUD (protected)
app.use('/api/transactions', transactionRoutes);

// Budget routes (protected)
app.use('/api/budgets', budgetRoutes);

// Dashboard routes (protected)
app.use('/api/dashboard', dashboardRoutes);

// Simple health-check (no DB)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Database connectivity check
app.get('/api/db-check', async (_req, res) => {
  try {
    const timeResult = await pool.query('SELECT NOW() AS server_time');

    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'categories', 'transactions', 'budgets')
      ORDER BY table_name;
    `);

    const foundTables = tablesResult.rows.map((r) => r.table_name);

    res.json({
      status: 'connected',
      serverTime: timeResult.rows[0].server_time,
      tables: foundTables,
    });
  } catch (err) {
    console.error('DB check failed:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// --------------- Start server ---------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

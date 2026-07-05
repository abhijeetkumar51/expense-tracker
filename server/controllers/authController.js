const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const SALT_ROUNDS = 10;

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- Validate required fields ---
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required: name, email, password',
      });
    }

    // --- Check if email already exists ---
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    // --- Hash the password ---
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // --- Insert the new user ---
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validate required fields ---
    if (!email || !password) {
      return res.status(400).json({
        error: 'Both email and password are required',
      });
    }

    // --- Look up user by email ---
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Generic message — don't reveal whether email or password is wrong
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // --- Compare passwords ---
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // --- Generate JWT ---
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/auth/me  (protected — requires authMiddleware)
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { signup, login, getMe };

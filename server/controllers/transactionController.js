const pool = require('../db/pool');

// POST /api/transactions
const createTransaction = async (req, res) => {
  try {
    const { category_id, amount, type, date, note } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!category_id || !amount || !type || !date) {
      return res.status(400).json({
        error: 'Required fields: category_id, amount, type, date',
      });
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'income' or 'expense'",
      });
    }

    // Verify category belongs to this user
    const catCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [category_id, userId]
    );

    if (catCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found or does not belong to you',
      });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, type, date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, category_id, amount, type, date, note`,
      [userId, category_id, amount, type, date, note || null]
    );

    return res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    console.error('Create transaction error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/transactions
// Optional query params: ?category_id=&type=&startDate=&endDate=
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, type, startDate, endDate } = req.query;

    let query = 'SELECT id, user_id, category_id, amount, type, date, note FROM transactions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (category_id) {
      query += ` AND category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (startDate) {
      query += ` AND date >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);

    return res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Get transactions error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, type, date, note } = req.body;
    const userId = req.user.id;

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'income' or 'expense'",
      });
    }

    // Check ownership
    const existing = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If updating category_id, verify it belongs to this user
    if (category_id) {
      const catCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
        [category_id, userId]
      );
      if (catCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Category not found or does not belong to you',
        });
      }
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = COALESCE($1, category_id),
           amount      = COALESCE($2, amount),
           type        = COALESCE($3, type),
           date        = COALESCE($4, date),
           note        = COALESCE($5, note)
       WHERE id = $6 AND user_id = $7
       RETURNING id, user_id, category_id, amount, type, date, note`,
      [category_id || null, amount || null, type || null, date || null, note || null, id, userId]
    );

    return res.json({ transaction: result.rows[0] });
  } catch (err) {
    console.error('Update transaction error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createTransaction, getTransactions, updateTransaction, deleteTransaction };

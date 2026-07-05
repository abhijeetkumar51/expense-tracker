const pool = require('../db/pool');

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Both name and type are required' });
    }

    // Validate type value
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'income' or 'expense'",
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, type`,
      [userId, name, type]
    );

    return res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    console.error('Create category error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, user_id, name, type FROM categories WHERE user_id = $1 ORDER BY id',
      [userId]
    );

    return res.json({ categories: result.rows });
  } catch (err) {
    console.error('Get categories error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const userId = req.user.id;

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        error: "Type must be either 'income' or 'expense'",
      });
    }

    // Check ownership
    const existing = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name), type = COALESCE($2, type)
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, name, type`,
      [name || null, type || null, id, userId]
    );

    return res.json({ category: result.rows[0] });
  } catch (err) {
    console.error('Update category error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };

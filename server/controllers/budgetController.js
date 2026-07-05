const pool = require('../db/pool');

// POST /api/budgets
const upsertBudget = async (req, res) => {
  try {
    const { category_id, monthly_limit } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!category_id || monthly_limit === undefined) {
      return res.status(400).json({ error: 'category_id and monthly_limit are required' });
    }

    if (typeof monthly_limit !== 'number' || monthly_limit <= 0) {
      return res.status(400).json({ error: 'monthly_limit must be a positive number' });
    }

    // Check if category belongs to user and is an 'expense' category
    const catCheck = await pool.query(
      'SELECT id, type FROM categories WHERE id = $1 AND user_id = $2',
      [category_id, userId]
    );

    if (catCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found or does not belong to you' });
    }

    if (catCheck.rows[0].type !== 'expense') {
      return res.status(400).json({ error: 'Budgets can only be set for expense categories' });
    }

    // Upsert budget (Insert, or Update if already exists)
    // Assuming the table structure has a unique constraint on (user_id, category_id)
    // If there is no unique constraint, we have to check manually. Let's do a manual check to be safe.
    
    const existing = await pool.query(
      'SELECT id FROM budgets WHERE user_id = $1 AND category_id = $2',
      [userId, category_id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update
      result = await pool.query(
        `UPDATE budgets 
         SET monthly_limit = $1 
         WHERE id = $2 
         RETURNING id, user_id, category_id, monthly_limit`,
        [monthly_limit, existing.rows[0].id]
      );
    } else {
      // Insert
      result = await pool.query(
        `INSERT INTO budgets (user_id, category_id, monthly_limit) 
         VALUES ($1, $2, $3) 
         RETURNING id, user_id, category_id, monthly_limit`,
        [userId, category_id, monthly_limit]
      );
    }

    return res.status(200).json({ budget: result.rows[0] });

  } catch (err) {
    console.error('Upsert budget error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/budgets
const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT b.id, b.user_id, b.category_id, b.monthly_limit, c.name as category_name
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
      ORDER BY c.name
    `, [userId]);

    return res.json({ budgets: result.rows });
  } catch (err) {
    console.error('Get budgets error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    return res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { upsertBudget, getBudgets, deleteBudget };

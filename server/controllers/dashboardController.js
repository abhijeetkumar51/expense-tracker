const pool = require('../db/pool');

// GET /api/dashboard/summary
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Use current month for analytics (PostgreSQL date_trunc)
    const startDate = await pool.query("SELECT date_trunc('month', CURRENT_DATE) as start");
    const monthStart = startDate.rows[0].start;

    // 1. Calculate Total Income & Total Expense for the month
    const totalsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
      WHERE user_id = $1 AND date >= $2
    `, [userId, monthStart]);

    const totalIncome = parseFloat(totalsResult.rows[0].total_income || 0);
    const totalExpense = parseFloat(totalsResult.rows[0].total_expense || 0);
    const balance = totalIncome - totalExpense;

    // 2. Category Breakdown (Expenses only) joined with Budgets
    const categoryBreakdownResult = await pool.query(`
      SELECT 
        c.name as category_name,
        COALESCE(SUM(t.amount), 0) as total_spent,
        b.monthly_limit
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.date >= $2
      LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = $1
      WHERE c.user_id = $1 AND c.type = 'expense'
      GROUP BY c.id, c.name, b.monthly_limit
    `, [userId, monthStart]);

    const overBudgetCategories = [];
    const categoryBreakdown = categoryBreakdownResult.rows.map(row => {
      const spent = parseFloat(row.total_spent);
      const limit = row.monthly_limit ? parseFloat(row.monthly_limit) : null;
      let percentageUsed = null;

      if (limit !== null) {
        percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;
        if (spent > limit) {
          overBudgetCategories.push(row.category_name);
        }
      }

      return {
        categoryName: row.category_name,
        totalSpent: spent,
        budgetLimit: limit,
        percentageUsed: percentageUsed ? parseFloat(percentageUsed.toFixed(2)) : null
      };
    });

    return res.json({
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
      overBudgetCategories
    });

  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getSummary };

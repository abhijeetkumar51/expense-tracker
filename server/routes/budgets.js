const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  upsertBudget,
  getBudgets,
  deleteBudget
} = require('../controllers/budgetController');

router.use(authMiddleware);

router.post('/', upsertBudget);
router.get('/', getBudgets);
router.delete('/:id', deleteBudget);

module.exports = router;

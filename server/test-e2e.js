const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const USERNAME = 'chaudharyabhijeet51@gmial.com';
const PASSWORD = 'Manu';

let token = '';
let results = [];

const logResult = (step, passed, detail = '') => {
  results.push({ step, passed, detail });
  if (passed) {
    console.log(`✅ PASS: ${step}`);
  } else {
    console.error(`❌ FAIL: ${step} - ${detail}`);
  }
};

async function runTests() {
  console.log('Starting E2E API Tests...\n');
  
  try {
    // 1. Signup / Login
    try {
      await axios.post(`${API_URL}/auth/signup`, { name: 'Abhijeet Chaudhary', email: USERNAME, password: PASSWORD });
      logResult('Signup new test user', true);
    } catch (signupErr) {
      if (signupErr.response?.status === 409) {
        // User already exists, proceed to login
      } else {
        logResult('Signup test user', false, signupErr.response?.data?.error || signupErr.message);
        return;
      }
    }

    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, { email: USERNAME, password: PASSWORD });
      token = loginRes.data.token;
      logResult('Login test user', true);
    } catch (loginErr) {
      logResult('Login test user', false, loginErr.response?.data?.error || loginErr.message);
      return;
    }

    const authConfig = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Create Categories
    let incCatId, expCatId;
    try {
      const incRes = await axios.post(`${API_URL}/categories`, { name: 'E2E Salary', type: 'income' }, authConfig);
      incCatId = incRes.data.category.id;
      
      const expRes = await axios.post(`${API_URL}/categories`, { name: 'E2E Shopping', type: 'expense' }, authConfig);
      expCatId = expRes.data.category.id;
      
      logResult('Create income and expense categories', true);
    } catch (err) {
      logResult('Create categories', false, err.response?.data?.error || err.message);
      return;
    }

    // 3. Create Transactions
    const d = new Date().toISOString().split('T')[0];
    try {
      await axios.post(`${API_URL}/transactions`, { category_id: incCatId, amount: 5000, type: 'income', date: d, note: 'E2E Test Income' }, authConfig);
      await axios.post(`${API_URL}/transactions`, { category_id: expCatId, amount: 1500, type: 'expense', date: d, note: 'E2E Test Expense' }, authConfig);
      logResult('Create transactions (5000 income, 1500 expense)', true);
    } catch (err) {
      logResult('Create transactions', false, err.response?.data?.error || err.message);
      return;
    }

    // 4. Set Budget
    try {
      await axios.post(`${API_URL}/budgets`, { category_id: expCatId, monthly_limit: 1000 }, authConfig);
      logResult('Set budget lower than expense amount (Limit 1000)', true);
    } catch (err) {
      logResult('Set budget', false, err.response?.data?.error || err.message);
      return;
    }

    // 5. Dashboard Summary Validation
    try {
      const dashRes = await axios.get(`${API_URL}/dashboard/summary`, authConfig);
      const data = dashRes.data;
      
      console.log('\n--- Dashboard Data Fetched ---');
      console.log(`Total Income: ${data.totalIncome}`);
      console.log(`Total Expense: ${data.totalExpense}`);
      console.log(`Balance: ${data.balance}`);
      console.log(`Over Budget Categories: ${data.overBudgetCategories.join(', ')}`);
      console.log('------------------------------\n');

      const incomeValid = typeof data.totalIncome === 'number';
      const expenseValid = typeof data.totalExpense === 'number';
      const balanceValid = data.balance === (data.totalIncome - data.totalExpense);
      
      const expBreakdown = data.categoryBreakdown.find(c => c.categoryName === 'E2E Shopping');
      const breakdownValid = expBreakdown && expBreakdown.budgetLimit === 1000 && expBreakdown.totalSpent >= 1500;
      
      const overBudgetValid = data.overBudgetCategories.includes('E2E Shopping');
      
      let failDetail = '';
      if (!incomeValid || !expenseValid || !balanceValid) failDetail += 'Balance math mismatch. ';
      if (!breakdownValid) failDetail += 'Category breakdown incorrect. ';
      if (!overBudgetValid) failDetail += 'Not flagged as over budget. ';

      if (failDetail === '') {
        logResult('Dashboard summary verification', true);
      } else {
        logResult('Dashboard summary verification', false, failDetail);
      }
    } catch (err) {
      logResult('Dashboard summary verification', false, err.response?.data?.error || err.message);
    }

  } catch (globalErr) {
    console.error('Fatal error:', globalErr);
  }

  // 6. Print Summary Table
  console.log('\n=== FINAL SUMMARY TABLE ===');
  console.table(results);
}

runTests();

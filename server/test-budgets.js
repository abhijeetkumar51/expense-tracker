const http = require('http');

let TOKEN = null;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (TOKEN) {
      options.headers['Authorization'] = `Bearer ${TOKEN}`;
    }
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (d) => (chunks += d));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(chunks); } catch { parsed = chunks; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function log(label, result) {
  console.log(`\n=== ${label} ===`);
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.body, null, 2));
}

async function run() {
  console.log('--- Logging in as test@example.com ---');
  const login = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'securePass123',
  });
  log('LOGIN', login);
  TOKEN = login.body.token;

  // 1. Create categories (Income & Expense)
  const incCatRes = await request('POST', '/api/categories', { name: 'Freelance', type: 'income' });
  const expCatRes = await request('POST', '/api/categories', { name: 'Dining', type: 'expense' });
  
  const incCatId = incCatRes.body.category.id;
  const expCatId = expCatRes.body.category.id;

  // 2. Add some transactions for current month
  const d = new Date();
  const todayStr = d.toISOString().split('T')[0];

  await request('POST', '/api/transactions', {
    category_id: incCatId, amount: 2000, type: 'income', date: todayStr
  });
  
  await request('POST', '/api/transactions', {
    category_id: expCatId, amount: 150, type: 'expense', date: todayStr
  });
  
  await request('POST', '/api/transactions', {
    category_id: expCatId, amount: 50, type: 'expense', date: todayStr
  });

  // 3. Set a Budget (Limit 150) -> will be over budget by 50
  const budget1 = await request('POST', '/api/budgets', {
    category_id: expCatId, monthly_limit: 150
  });
  log('SET BUDGET (Limit: 150)', budget1);

  // 4. Set budget AGAIN (Testing Upsert behavior)
  const budget2 = await request('POST', '/api/budgets', {
    category_id: expCatId, monthly_limit: 180
  });
  log('UPSERT BUDGET (New Limit: 180, Spent: 200 -> Over budget)', budget2);

  // 5. Try setting budget for someone else's category (fake ID)
  const fakeBudget = await request('POST', '/api/budgets', {
    category_id: 99999, monthly_limit: 500
  });
  log('SET BUDGET FAKE CATEGORY (expect 404)', fakeBudget);

  // 6. Get all budgets
  const allBudgets = await request('GET', '/api/budgets');
  log('GET ALL BUDGETS', allBudgets);

  // 7. Test Dashboard Summary
  const summary = await request('GET', '/api/dashboard/summary');
  log('DASHBOARD SUMMARY', summary);

  // Cleanup
  console.log('\n--- Cleaning up test data ---');
  // Deleting categories automatically cascades and deletes related transactions & budgets in a proper setup.
  // If not cascading, we just delete them manually or leave them for test visibility.
  // We'll leave them so you can see them in your DB if you want.
}

run().catch(console.error);

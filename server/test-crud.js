// Full CRUD test for categories and transactions
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
  // ---- Login first (user created in previous tests) ----
  console.log('--- Logging in as test@example.com ---');
  const login = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'securePass123',
  });
  log('LOGIN', login);
  TOKEN = login.body.token;

  // ---- CATEGORY TESTS ----

  // 1. Create income category
  const cat1 = await request('POST', '/api/categories', {
    name: 'Salary', type: 'income',
  });
  log('CREATE CATEGORY 1 (income)', cat1);

  // 2. Create expense category
  const cat2 = await request('POST', '/api/categories', {
    name: 'Groceries', type: 'expense',
  });
  log('CREATE CATEGORY 2 (expense)', cat2);

  // 3. Get all categories
  const allCats = await request('GET', '/api/categories');
  log('GET ALL CATEGORIES', allCats);

  // 4. Update category 1
  const catId1 = cat1.body.category.id;
  const updCat = await request('PUT', `/api/categories/${catId1}`, {
    name: 'Monthly Salary',
  });
  log('UPDATE CATEGORY 1', updCat);

  // ---- TRANSACTION TESTS ----

  const catId2 = cat2.body.category.id;

  // 5. Create a transaction
  const tx1 = await request('POST', '/api/transactions', {
    category_id: catId2,
    amount: 1500.50,
    type: 'expense',
    date: '2026-07-04',
    note: 'Weekly grocery shopping',
  });
  log('CREATE TRANSACTION', tx1);

  // 6. Get all transactions
  const allTx = await request('GET', '/api/transactions');
  log('GET ALL TRANSACTIONS', allTx);

  // 7. Update the transaction
  const txId = tx1.body.transaction.id;
  const updTx = await request('PUT', `/api/transactions/${txId}`, {
    amount: 1800,
    note: 'Updated grocery total',
  });
  log('UPDATE TRANSACTION', updTx);

  // 8. Try accessing a non-existent transaction (simulates "not yours")
  const fakeTx = await request('PUT', '/api/transactions/999999', {
    amount: 100,
  });
  log('UPDATE NON-EXISTENT TRANSACTION (expect 404)', fakeTx);

  // 9. Delete the transaction
  const delTx = await request('DELETE', `/api/transactions/${txId}`);
  log('DELETE TRANSACTION', delTx);

  // 10. Confirm it's gone
  const afterDel = await request('GET', '/api/transactions');
  log('GET TRANSACTIONS AFTER DELETE (should be empty)', afterDel);

  // ---- Cleanup: delete categories ----
  await request('DELETE', `/api/categories/${catId1}`);
  await request('DELETE', `/api/categories/${catId2}`);
  console.log('\n--- Cleanup: deleted test categories ---');
}

run().catch(console.error);

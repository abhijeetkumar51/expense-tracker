// Test script for the full auth flow
const http = require('http');

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
    if (request.token) {
      options.headers['Authorization'] = `Bearer ${request.token}`;
    }
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (d) => (chunks += d));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(chunks) });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}
request.token = null;

async function runTests() {
  console.log('=== TEST 1: Signup a new user ===');
  const signup = await request('POST', '/api/auth/signup', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'securePass123',
  });
  console.log(`Status: ${signup.status}`);
  console.log(JSON.stringify(signup.body, null, 2));

  console.log('\n=== TEST 2: Signup same email again (expect 409) ===');
  const dupSignup = await request('POST', '/api/auth/signup', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'securePass123',
  });
  console.log(`Status: ${dupSignup.status}`);
  console.log(JSON.stringify(dupSignup.body, null, 2));

  console.log('\n=== TEST 3: Login with correct credentials ===');
  const login = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'securePass123',
  });
  console.log(`Status: ${login.status}`);
  console.log(JSON.stringify(login.body, null, 2));

  console.log('\n=== TEST 4: Login with wrong password (expect 401) ===');
  const badLogin = await request('POST', '/api/auth/login', {
    email: 'test@example.com',
    password: 'wrongPassword',
  });
  console.log(`Status: ${badLogin.status}`);
  console.log(JSON.stringify(badLogin.body, null, 2));

  console.log('\n=== TEST 5: GET /api/auth/me WITH token ===');
  request.token = login.body.token;
  const me = await request('GET', '/api/auth/me');
  console.log(`Status: ${me.status}`);
  console.log(JSON.stringify(me.body, null, 2));

  console.log('\n=== TEST 6: GET /api/auth/me WITHOUT token (expect 401) ===');
  request.token = null;
  const noAuth = await request('GET', '/api/auth/me');
  console.log(`Status: ${noAuth.status}`);
  console.log(JSON.stringify(noAuth.body, null, 2));
}

runTests().catch(console.error);

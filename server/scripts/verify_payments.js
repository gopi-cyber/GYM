
process.removeAllListeners('warning');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
const BASE = 'http://localhost:4000';
const SECRET = 'dev_secret';
const PAYLOAD = {
  id: '711422ac-5682-4292-a75f-2a5a805748b3',
  email: 'admin@gms.com',
  role: 'owner',
  company_id: 'f3780984-6096-4f85-a57e-75a1fbc902db',
  gym_db_path: path.resolve('data/gyms/demo-gym.db')
};
const token = jwt.sign(PAYLOAD, SECRET, { expiresIn: '7d' });
function authRequest(method, reqPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
    const req = http.request(BASE + reqPath, { method, headers }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.status, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}
(async () => {
  const hello = await new Promise((resolve) => http.get(BASE + '/api/health', res => { let r=''; res.on('data', c=>r+=c); res.on('end',()=>resolve(r)); }));
  console.log('health='+hello);
  const r1 = await authRequest('GET', '/api/plans');
  console.log('plans=' + r1.status + '|' + r1.body.slice(0, 80));
  const r2 = await authRequest('POST', '/api/payments/checkout', { plan_slug: 'starter' });
  console.log('checkout=' + r2.status + '|' + r2.body.slice(0, 80));
  const r3 = await authRequest('GET', '/api/subscriptions/current');
  console.log('subscription=' + r3.status + '|' + r3.body.slice(0, 80));
  const r4 = await authRequest('GET', '/api/inventory');
  console.log('inventory=' + r4.status + '|' + r4.body.slice(0, 80));
  const r5 = await authRequest('GET', '/api/admin/stats');
  console.log('admin=' + r5.status + '|' + r5.body.slice(0, 80));
})().catch(ex => console.error('fatal=' + ex.message));

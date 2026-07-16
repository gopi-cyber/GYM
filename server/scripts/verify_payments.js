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

function call(method, reqPath, body) {
  const data = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE') {
    headers['Authorization'] = 'Bearer ' + jwt.sign(PAYLOAD, SECRET, { expiresIn: '7d' });
  }
  return new Promise((resolve, reject) => {
    const req = http.request(BASE + reqPath, { method, headers }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.status, body: raw ? JSON.parse(raw) : null }); }
        catch (e) { resolve({ status: res.status, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const l = await call('POST', '/api/auth/login', { email: 'admin@gms.com', password: 'admin123' });
  const t = l.body?.token;
  if (!t) {
    console.log('FAIL login', l.status, l.body?.error);
    process.exit(1);
  }

  function authCall(m, p, b) {
    const data = b ? JSON.stringify(b) : null;
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t };
    return new Promise((resolve, reject) => {
      const req = http.request(BASE + p, { method: m, headers }, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try { resolve({ status: res.status, body: raw ? JSON.parse(raw) : null }); }
          catch (e) { resolve({ status: res.status, body: raw }); }
        });
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  const plans = await authCall('GET', '/api/plans');
  console.log('plans', plans.status, Array.isArray(plans.body) ? plans.body.map(x => x.slug) : plans.body?.error);

  const checkout = await authCall('POST', '/api/payments/checkout', { plan_slug: 'starter' });
  console.log('checkout', checkout.status, checkout.body?.simulated === true ? 'simulated' : 'stripe', checkout.body?.error || checkout.body?.status || (checkout.body?.url ? 'url_ok' : ''));

  const sub = await authCall('GET', '/api/subscriptions/current');
  console.log('subscription', sub.status, sub.body?.status || sub.body?.error);

  const inv = await authCall('GET', '/api/inventory');
  console.log('inventory', inv.status, Array.isArray(inv.body) ? inv.body.length + ' rows' : 'blocked', Array.isArray(inv.body) ? '' : (inv.body?.error || inv.body));

  const invoices = await authCall('GET', '/api/admin/invoices?limit=2&offset=0');
  console.log('admin invoices', invoices.status, Array.isArray(invoices.body) ? invoices.body.length + ' rows' : 'err', Array.isArray(invoices.body) ? invoices.body[0]?.plan_name || invoices.body[0]?.plan_slug || '-' : (invoices.body?.error || invoices.body));
})().catch(e => console.error('run_err', e));

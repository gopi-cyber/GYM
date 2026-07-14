  const http = require('http');
  const data = JSON.stringify({ email: 'owner@test.local', password: 'pass123' });
  const req1 = http.request({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Length': Buffer.byteLength(data), 'Content-Type': 'application/json' } }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(body);
      const token = parsed.token;
      if (!token) { console.log('LOGIN_FAIL'); process.exit(1); }
      const putData = JSON.stringify({ name: 'Alpha Owner X', email: 'owner@test.local', phone: '1234567890', gymAddress: '123 Fitness St', gpsLocation: '37.77,-122.41', mobileNumber: '9876543210' });
      const req2 = http.request({ hostname: 'localhost', port: 4000, path: '/api/users/me', method: 'PUT', headers: { 'Authorization': 'Bearer ' + token, 'Content-Length': Buffer.byteLength(putData), 'Content-Type': 'application/json' } }, res2 => {
        let out = '';
        res2.on('data', chunk => out += chunk);
        res2.on('end', () => {
          const user = JSON.parse(out);
          const ok = ['gymAddress', 'gpsLocation', 'mobileNumber', 'phone'].every(f => user[f] && user[f] !== null && String(user[f]).trim().length > 0);
          ['gymAddress', 'gpsLocation', 'mobileNumber', 'phone'].forEach(f => process.stdout.write((user[f] ? 'PASS' : 'FAIL') + ' ' + f + '\n'));
          if (!ok) process.exit(1);
          console.log('VERIFICATION_OK');
        });
      });
      req2.write(putData);
      req2.end();
    });
  });
  req1.write(data);
  req1.end();

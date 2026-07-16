const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '711422ac-5682-4292-a75f-2a5a805748b3',
  email: 'admin@gms.com',
  role: 'owner',
  company_id: 'f3780984-6096-4f85-a57e-75a1fbc902db',
  gym_db_path: require('path').resolve('data/gyms/demo-gym.db')
}, 'dev_secret', { expiresIn: '7d' });
console.log(token);

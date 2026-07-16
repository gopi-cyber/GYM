require('dotenv').config();
const jwt = require('jsonwebtoken');
const path = require('path');

const secret = process.env.JWT_SECRET || 'dev_secret';
const payload = {
  id: '711422ac-5682-4292-a75f-2a5a805748b3',
  email: 'admin@gms.com',
  role: 'owner',
  company_id: 'f3780984-6096-4f85-a57e-75a1fbc902db',
  gym_db_path: path.resolve('data/gyms/demo-gym.db'),
};
const token = jwt.sign(payload, secret, { expiresIn: '7d' });
console.log(token);

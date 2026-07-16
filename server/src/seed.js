// Seeds the database with default users, directory, inventory, attendance, and fitness plans.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const registry = require('./registry');
const { forCompany } = require('./gymDb');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function ensureCompany(slug, name) {
  let company = registry.prepare('SELECT * FROM companies WHERE slug = ?').get(slug);
  if (!company) {
    const companyId = uuidv4();
    const dbPath = require('path').resolve(__dirname, process.env.GYM_DB_DIR || 'data/gyms', `${slug}.db`);
    registry.prepare('INSERT INTO companies (id, name, slug, db_path) VALUES (?, ?, ?, ?)').run(companyId, name || slug, slug, dbPath);
    company = { id: companyId, name: name || slug, slug, db_path: dbPath };
  } else if (!company.db_path) {
    const dbPath = require('path').resolve(__dirname, process.env.GYM_DB_DIR || 'data/gyms', `${slug}.db`);
    registry.prepare('UPDATE companies SET db_path = ? WHERE id = ?').run(dbPath, company.id);
    company = { ...company, db_path: dbPath };
  }
  return company;
}

function upsertRegistryUser({ id, email, password, name, role, companyId, admin = false }) {
  const existing = registry.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    registry.prepare(
      'UPDATE users SET name = ?, role = ?, company_id = ?, is_admin = ? WHERE id = ?'
    ).run(name, role, companyId, admin ? 1 : 0, existing.id);
    return existing.id;
  }
  const hash = bcrypt.hashSync(password, 10);
  registry.prepare(
    'INSERT INTO users (id, email, password_hash, name, role, company_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, email, hash, name, role, companyId, admin ? 1 : 0);
  return id;
}

const company = ensureCompany('demo-gym', 'Demo Gym');
const ownerId = upsertRegistryUser({ id: uuidv4(), email: 'admin@gms.com', password: 'admin123', name: 'Admin Owner', role: 'owner', companyId: company.id, admin: true });
const trainerId = upsertRegistryUser({ id: uuidv4(), email: 'trainer@gms.com', password: 'trainer123', name: 'Coach Vicky', role: 'trainer', companyId: company.id });
const customerId = upsertRegistryUser({ id: uuidv4(), email: 'client@gms.com', password: 'client123', name: 'John Doe', role: 'customer', companyId: company.id });

console.log('Users seeded:', { ownerId, trainerId, customerId, companyId: company.id });

const gymDb = forCompany(company.id, company.db_path);

const dirCount = gymDb.prepare('SELECT COUNT(*) as c FROM directory').get().c;
if (dirCount === 0) {
  const entries = [
    { name: 'Coach Vicky', type: 'trainer', specialty: 'Strength & Conditioning', experience: '6 Years', avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200', bio: 'Specializes in powerlifting and athletic conditioning.', linked_user_id: trainerId },
    { name: 'Coach Priya', type: 'trainer', specialty: 'Yoga & Flexibility', experience: '4 Years', avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=200', bio: 'Dedicated to mindfulness, posture alignment, and core stability.' },
    { name: 'Coach Surya', type: 'trainer', specialty: 'Cardio & HIIT specialist', experience: '5 Years', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=200', bio: 'High energy trainer focused on fat loss and endurance.' },
    { name: 'Dr. Rajesh Kumar', type: 'doctor', specialty: 'Sports Physical Therapist', hospital: 'Apex Physio Clinic', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', bio: 'Rehabilitation specialist with 8+ years treating sports injuries.' },
    { name: 'Dr. Shalini Sen', type: 'doctor', specialty: 'Dietitian & Nutritionist', hospital: 'NutriLife Center', avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200', bio: 'Creates structured meal plans for metabolic health and weight loss.' },
    { name: 'Dr. Amit Patel', type: 'doctor', specialty: 'Sports Medicine Consultant', hospital: 'Care Health Hospital', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', bio: 'Expert in non-surgical muscle and joint issues, and peak performance planning.' }
  ];
  const insert = gymDb.prepare('INSERT INTO directory (id, name, type, specialty, experience, hospital, avatar, bio, linked_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  entries.forEach(e => insert.run(uuidv4(), e.name, e.type, e.specialty || null, e.experience || null, e.hospital || null, e.avatar || null, e.bio || null, e.linked_user_id || null));
  console.log(`Seeded ${entries.length} directory entries.`);
}

const invCount = gymDb.prepare('SELECT COUNT(*) as c FROM inventory').get().c;
if (invCount === 0) {
  const items = [
    { name: 'Commercial Treadmill X10', type: 'equipment', quantity: 5, status: 'Functional', lastServiced: '2026-05-12' },
    { name: 'Olympic Barbell & Weights Set', type: 'equipment', quantity: 4, status: 'Functional', lastServiced: '2026-04-10' },
    { name: 'Smith Machine', type: 'equipment', quantity: 1, status: 'Under Maintenance', lastServiced: '2026-07-01' },
    { name: 'Power Cage / Rack', type: 'equipment', quantity: 2, status: 'Functional', lastServiced: '2026-06-15' },
    { name: 'Premium Whey Protein (2kg)', type: 'subliment', quantity: 4, status: 'Functional', threshold: 10 },
    { name: 'Cotton Towels (Pack of 50)', type: 'subliment', quantity: 12, status: 'Functional', threshold: 15 },
    { name: 'Hydration Energy Drinks (Case)', type: 'subliment', quantity: 25, status: 'Functional', threshold: 10 }
  ];
  const insert = gymDb.prepare('INSERT INTO inventory (id, company_id, name, type, quantity, status, threshold, last_serviced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  items.forEach(i => insert.run(uuidv4(), company.id, i.name, i.type, i.quantity, i.status, i.threshold || null, i.lastServiced || null));
  console.log(`Seeded ${items.length} inventory items.`);
}

const attCount = gymDb.prepare('SELECT COUNT(*) as c FROM attendance').get().c;
if (attCount === 0) {
  const records = [
    { date: '2026-07-06', checkIn: '07:15', checkOut: '08:45', duration: 1.5 },
    { date: '2026-07-07', checkIn: '07:30', checkOut: '09:00', duration: 1.5 },
    { date: '2026-07-08', checkIn: '08:00', checkOut: '09:30', duration: 1.5 },
    { date: '2026-07-09', checkIn: '18:15', checkOut: '20:00', duration: 1.75 },
    { date: '2026-07-10', checkIn: '17:30', checkOut: '19:15', duration: 1.75 }
  ];
  const insert = gymDb.prepare('INSERT INTO attendance (id, company_id, user_id, date, check_in, check_out, duration) VALUES (?, ?, ?, ?, ?, ?, ?)');
  records.forEach(r => insert.run(uuidv4(), company.id, customerId, r.date, r.checkIn, r.checkOut, r.duration));
  console.log(`Seeded ${records.length} attendance records.`);
}

const fpCount = gymDb.prepare('SELECT COUNT(*) as c FROM fitness_plans WHERE company_id = ? AND customer_id = ?').get(company.id, customerId).c;
if (fpCount === 0) {
  const workoutPlan = [
    { day: 'Monday', focus: 'Chest & Triceps', exercises: '1. Bench Press (4x10)\n2. Incline DB Press (3x12)\n3. Cable Crossovers (3x15)\n4. Overhead Skullcrushers (4x12)' },
    { day: 'Wednesday', focus: 'Back & Biceps', exercises: '1. Deadlift (4x6)\n2. Lat Pulldowns (4x10)\n3. Barbell Rows (3x10)\n4. Hammer Curls (3x12)' },
    { day: 'Friday', focus: 'Legs & Shoulders', exercises: '1. Barbell Squats (4x8)\n2. Leg Press (3x12)\n3. Overhead Press (4x10)\n4. Lateral Raises (3x15)' }
  ];
  const nutritionPlan = [
    { meal: 'Breakfast', detail: '4 Egg Whites, 2 slices Whole Wheat Toast, Black Coffee' },
    { meal: 'Lunch', detail: '200g Grilled Chicken Breast, 150g Brown Rice, Steamed Broccoli' },
    { meal: 'Snack', detail: '1 scoop Whey Protein in Water, 1 Banana, 15g Almonds' },
    { meal: 'Dinner', detail: '180g Baked Salmon, Quinoa Salad, Grilled Asparagus' }
  ];
  gymDb.prepare('INSERT INTO fitness_plans (id, company_id, customer_id, trainer_id, workout_plan, nutrition_plan) VALUES (?, ?, ?, ?, ?, ?)').run(uuidv4(), company.id, customerId, trainerId, JSON.stringify(workoutPlan), JSON.stringify(nutritionPlan));
  console.log('Seeded 1 fitness plan.');
}

console.log('\nSeed complete. Login credentials:');
console.log('  Owner:    admin@gms.com / admin123');
console.log('  Trainer:  trainer@gms.com / trainer123');
console.log('  Customer: client@gms.com / client123');
console.log('Company:   demo-gym / Demo Gym');

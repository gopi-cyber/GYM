// Seeds the database with default users, directory, inventory, attendance, and fitness plans.
// Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function upsertUser({ id, email, password, name, role, membership, joinedDate }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return existing.id;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, membership, joined_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, hash, name, role, membership || null, joinedDate || new Date().toISOString().slice(0, 10));
  return id;
}

const ownerId = upsertUser({ id: uuidv4(), email: 'admin@gms.com', password: 'admin123', name: 'Admin Owner', role: 'owner' });
const trainerId = upsertUser({ id: uuidv4(), email: 'trainer@gms.com', password: 'trainer123', name: 'Coach Vicky', role: 'trainer' });
const customerId = upsertUser({ id: uuidv4(), email: 'client@gms.com', password: 'client123', name: 'John Doe', role: 'customer', membership: 'Pro', joinedDate: '2026-01-10' });

console.log('Users seeded:', { ownerId, trainerId, customerId });

// Directory
const directoryCount = db.prepare('SELECT COUNT(*) as c FROM directory').get().c;
if (directoryCount === 0) {
  const entries = [
    { name: 'Coach Vicky', type: 'trainer', specialty: 'Strength & Conditioning', experience: '6 Years', avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200', bio: 'Specializes in powerlifting and athletic conditioning.', linked_user_id: trainerId },
    { name: 'Coach Priya', type: 'trainer', specialty: 'Yoga & Flexibility', experience: '4 Years', avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=200', bio: 'Dedicated to mindfulness, posture alignment, and core stability.' },
    { name: 'Coach Surya', type: 'trainer', specialty: 'Cardio & HIIT specialist', experience: '5 Years', avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=80&w=200', bio: 'High energy trainer focused on fat loss and endurance.' },
    { name: 'Dr. Rajesh Kumar', type: 'doctor', specialty: 'Sports Physical Therapist', hospital: 'Apex Physio Clinic', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', bio: 'Rehabilitation specialist with 8+ years treating sports injuries.' },
    { name: 'Dr. Shalini Sen', type: 'doctor', specialty: 'Dietitian & Nutritionist', hospital: 'NutriLife Center', avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200', bio: 'Creates structured meal plans for metabolic health and weight loss.' },
    { name: 'Dr. Amit Patel', type: 'doctor', specialty: 'Sports Medicine Consultant', hospital: 'Care Health Hospital', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', bio: 'Expert in non-surgical muscle and joint issues, and peak performance planning.' }
  ];
  const insert = db.prepare(`
    INSERT INTO directory (id, name, type, specialty, experience, hospital, avatar, bio, linked_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  entries.forEach(e => insert.run(uuidv4(), e.name, e.type, e.specialty || null, e.experience || null, e.hospital || null, e.avatar || null, e.bio || null, e.linked_user_id || null));
  console.log(`Seeded ${entries.length} directory entries.`);
}

// Inventory
const inventoryCount = db.prepare('SELECT COUNT(*) as c FROM inventory').get().c;
if (inventoryCount === 0) {
  const items = [
    { name: 'Commercial Treadmill X10', type: 'equipment', quantity: 5, status: 'Functional', last_serviced: '2026-05-12' },
    { name: 'Olympic Barbell & Weights Set', type: 'equipment', quantity: 4, status: 'Functional', last_serviced: '2026-04-10' },
    { name: 'Smith Machine', type: 'equipment', quantity: 1, status: 'Under Maintenance', last_serviced: '2026-07-01' },
    { name: 'Power Cage / Rack', type: 'equipment', quantity: 2, status: 'Functional', last_serviced: '2026-06-15' },
    { name: 'Premium Whey Protein (2kg)', type: 'subliment', quantity: 4, status: 'Functional', threshold: 10 },
    { name: 'Cotton Towels (Pack of 50)', type: 'subliment', quantity: 12, status: 'Functional', threshold: 15 },
    { name: 'Hydration Energy Drinks (Case)', type: 'subliment', quantity: 25, status: 'Functional', threshold: 10 }
  ];
  const insert = db.prepare(`
    INSERT INTO inventory (id, name, type, quantity, status, threshold, last_serviced)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  items.forEach(i => insert.run(uuidv4(), i.name, i.type, i.quantity, i.status, i.threshold || null, i.last_serviced || null));
  console.log(`Seeded ${items.length} inventory items.`);
}

// Attendance (sample history for the seeded customer)
const attendanceCount = db.prepare('SELECT COUNT(*) as c FROM attendance').get().c;
if (attendanceCount === 0) {
  const records = [
    { date: '2026-07-06', check_in: '07:15', check_out: '08:45', duration: 1.5 },
    { date: '2026-07-07', check_in: '07:30', check_out: '09:00', duration: 1.5 },
    { date: '2026-07-08', check_in: '08:00', check_out: '09:30', duration: 1.5 },
    { date: '2026-07-09', check_in: '18:15', check_out: '20:00', duration: 1.75 },
    { date: '2026-07-10', check_in: '17:30', check_out: '19:15', duration: 1.75 }
  ];
  const insert = db.prepare('INSERT INTO attendance (id, user_id, date, check_in, check_out, duration) VALUES (?, ?, ?, ?, ?, ?)');
  records.forEach(r => insert.run(uuidv4(), customerId, r.date, r.check_in, r.check_out, r.duration));
  console.log(`Seeded ${records.length} attendance records.`);
}

// Fitness plan
const planCount = db.prepare('SELECT COUNT(*) as c FROM fitness_plans WHERE customer_id = ?').get(customerId).c;
if (planCount === 0) {
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
  db.prepare(`
    INSERT INTO fitness_plans (id, customer_id, trainer_id, workout_plan, nutrition_plan)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), customerId, trainerId, JSON.stringify(workoutPlan), JSON.stringify(nutritionPlan));
  console.log('Seeded 1 fitness plan.');
}

console.log('\nSeed complete. Login credentials:');
console.log('  Owner:    admin@gms.com / admin123');
console.log('  Trainer:  trainer@gms.com / trainer123');
console.log('  Customer: client@gms.com / client123');

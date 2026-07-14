// API Client Layer for Gym Management System (GMS)
// Replaces the old LocalStorage mock DB. Talks to the VigorGMS Express/SQLite
// backend at API_BASE. Because the existing UI code (components.js) calls
// db.* functions SYNCHRONOUSLY in many render paths, this module keeps an
// in-memory cache that is populated by async loaders (initDB/login/register)
// and exposes synchronous getters that simply read from that cache. Mutating
// operations (save/delete) are async: they call the API then patch the cache.

const API_BASE = 'http://localhost:4000/api';

const STORAGE_KEYS = {
  TOKEN: 'gms_token',
  USER: 'gms_user'
};

// In-memory cache. Populated by initDB()/login()/register().
let cache = {
  directory: [],
  users: [],
  inventory: [],
  attendance: [],
  fitnessPlans: [] // UI-shaped plan objects the current session can see
};

// ---------------------------------------------------------------------------
// Low level helpers
// ---------------------------------------------------------------------------

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = null; }
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Roles are lowercase in the DB/API ('owner','trainer','customer'). The UI
// (components.js) was written against capitalized role strings
// ('Owner','Trainer','Customer') for both comparisons and display, so we
// normalize once here: cached/displayed user objects carry a Capitalized
// role, and toApiRole() lowercases it again whenever we talk to the API.
function capitalizeRole(role) {
  if (!role) return role;
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function toApiRole(role) {
  return (role || '').toLowerCase();
}

// ---------------------------------------------------------------------------
// Shape adapters: API (snake_case) <-> UI (camelCase, matches old mock shape)
// ---------------------------------------------------------------------------

function userFromApi(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: capitalizeRole(row.role),
    membership: row.membership,
    joinedDate: row.joined_date || row.joinedDate
  };
}

function inventoryFromApi(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    quantity: row.quantity,
    status: row.status,
    threshold: row.threshold === null || row.threshold === undefined ? undefined : row.threshold,
    lastServiced: row.last_serviced || undefined
  };
}

function inventoryToApi(item) {
  return {
    name: item.name,
    type: item.type,
    quantity: item.quantity,
    status: item.status,
    threshold: item.threshold === undefined ? null : item.threshold,
    last_serviced: item.lastServiced === undefined ? null : item.lastServiced
  };
}

function attendanceFromApi(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    checkIn: row.check_in || '',
    checkOut: row.check_out || '',
    duration: row.duration === null || row.duration === undefined ? 0 : row.duration
  };
}

function planFromApi(row, trainerName) {
  return {
    id: row.id,
    customerId: row.customer_id,
    trainerId: row.trainer_id,
    trainerName: trainerName || '',
    workoutPlan: row.workout_plan || [],
    nutritionPlan: row.nutrition_plan || []
  };
}

// ---------------------------------------------------------------------------
// Init / session loading
// ---------------------------------------------------------------------------

// initDB() is now ASYNC. app.js awaits this before the first navigate().
export async function initDB() {
  // Public directory is always fetchable, auth or no auth.
  try {
    cache.directory = await apiFetch('/directory');
  } catch (e) {
    cache.directory = [];
  }

  const token = getToken();
  if (!token) return;

  try {
    const me = await apiFetch('/users/me');
    const user = userFromApi(me);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await loadRoleData(user);
  } catch (e) {
    // Expired/invalid token - fall back to logged-out state.
    clearCurrentUser();
  }
}

// Fetches everything the given (already-authenticated) user's role needs,
// and populates the cache. Called by initDB() on page load and by
// login()/register() right after obtaining a token.
async function loadRoleData(user) {
  const apiRole = toApiRole(user.role);

  // Inventory - any authenticated role can view.
  try {
    cache.inventory = (await apiFetch('/inventory')).map(inventoryFromApi);
  } catch (e) {
    cache.inventory = [];
  }

  // Attendance - server scopes rows to "own" unless owner.
  try {
    cache.attendance = (await apiFetch('/attendance')).map(attendanceFromApi);
  } catch (e) {
    cache.attendance = [];
  }

  // User directory listing - owner sees everyone; trainer needs the
  // customer roster to assign fitness plans (see server/src/routes/users.js
  // note: requireRole was widened from ('owner') to ('owner','trainer') to
  // support this - the old frontend's trainer dashboard has no other way to
  // enumerate clients). Customers only "see" themselves.
  if (apiRole === 'owner' || apiRole === 'trainer') {
    try {
      cache.users = (await apiFetch('/users')).map(userFromApi);
    } catch (e) {
      cache.users = [user];
    }
  } else {
    cache.users = [user];
  }

  // Fitness plans - no bulk-list endpoint exists server-side, so we build
  // the cache appropriate to the role:
  //  - customer: just their own plan (GET /fitness-plans/me)
  //  - trainer: loop each customer and fetch GET /fitness-plans/customer/:id
  //    (404 simply means "no plan yet" for that client - skipped)
  //  - owner: not used by any current dashboard view, left empty
  cache.fitnessPlans = [];
  if (apiRole === 'customer') {
    try {
      const row = await apiFetch('/fitness-plans/me');
      const trainer = cache.users.find(u => u.id === row.trainer_id);
      cache.fitnessPlans = [planFromApi(row, trainer && trainer.name)];
    } catch (e) {
      cache.fitnessPlans = [];
    }
  } else if (apiRole === 'trainer') {
    const customers = cache.users.filter(u => u.role === 'Customer');
    const plans = [];
    for (const c of customers) {
      try {
        const row = await apiFetch(`/fitness-plans/customer/${c.id}`);
        const trainer = cache.users.find(u => u.id === row.trainer_id);
        plans.push(planFromApi(row, trainer && trainer.name));
      } catch (e) {
        // no plan for this customer yet - fine, skip
      }
    }
    cache.fitnessPlans = plans;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email, password) {
  const { token, user } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setToken(token);
  const uiUser = userFromApi(user);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(uiUser));
  await loadRoleData(uiUser);
  return uiUser;
}

// role should be 'Customer' | 'Trainer' | 'Owner' (server normalizes allowed self-registration roles).
// companySlug and phone are optional for register; phone is used for owner notifications.
export async function register({ name, email, password, role, companySlug, phone }) {
  const payload = { name, email, password, role: toApiRole(role) };
  if (companySlug) payload.companySlug = companySlug;
  if (phone) payload.phone = phone;
  const { token, user } = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setToken(token);
  const uiUser = userFromApi(user);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(uiUser));
  await loadRoleData(uiUser);
  return uiUser;
}

export function getCurrentUser() {
  const str = localStorage.getItem(STORAGE_KEYS.USER);
  return str ? JSON.parse(str) : null;
}

// Kept for backward compatibility with any old call sites; no-op beyond
// persisting locally, since the source of truth is the JWT + /users/me now.
export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function clearCurrentUser() {
  setToken(null);
  localStorage.removeItem(STORAGE_KEYS.USER);
  cache = { directory: cache.directory, users: [], inventory: [], attendance: [], fitnessPlans: [] };
}

// ---------------------------------------------------------------------------
// Synchronous cache getters (used throughout components.js render code)
// ---------------------------------------------------------------------------

export function getDirectory() { return cache.directory; }
export function getUsers() { return cache.users; }
export function getInventory() { return cache.inventory; }
export function getAttendance() { return cache.attendance; }
export function getFitnessPlans() { return cache.fitnessPlans; }

// ---------------------------------------------------------------------------
// Async mutators - call the API, then patch the in-memory cache
// ---------------------------------------------------------------------------

// Directory (owner only on the backend). Not currently wired to any UI
// control (the old mock frontend never had an "add directory entry" admin
// form), but implemented here for parity with the mock API surface.
export async function saveDirectoryItem(item) {
  const row = await apiFetch('/directory', {
    method: 'POST',
    body: JSON.stringify({
      name: item.name,
      type: item.type,
      specialty: item.specialty,
      experience: item.experience,
      hospital: item.hospital,
      avatar: item.avatar,
      bio: item.bio,
      linkedUserId: item.linkedUserId
    })
  });
  cache.directory.push(row);
  return row;
}

// Legacy no-op-ish helper: user creation now goes through register(). Left
// in place only so an accidental stray call doesn't throw a hard import
// error; it does not talk to the server.
export function saveUser(user) {
  console.warn('db.saveUser() is deprecated - use db.register() instead.');
  return user;
}

export async function saveInventory(item) {
  const existing = cache.inventory.find(i => i.id === item.id);
  let row;
  if (existing) {
    row = await apiFetch(`/inventory/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryToApi(item))
    });
  } else {
    row = await apiFetch('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryToApi(item))
    });
  }
  const uiItem = inventoryFromApi(row);
  const idx = cache.inventory.findIndex(i => i.id === uiItem.id);
  if (idx !== -1) cache.inventory[idx] = uiItem; else cache.inventory.push(uiItem);
  return uiItem;
}

export async function deleteInventory(itemId) {
  await apiFetch(`/inventory/${itemId}`, { method: 'DELETE' });
  cache.inventory = cache.inventory.filter(i => i.id !== itemId);
}

// The old mock UI's "front desk QR scanner" toggles a specific member's
// check-in/check-out by userId - that doesn't map onto the backend's
// self-service /attendance/checkin and /attendance/checkout endpoints
// (those always act on req.user, the *authenticated* caller). A minimal
// owner/trainer-only endpoint, POST /api/attendance/log { userId }, was
// added to server/src/routes/attendance.js to support this: it toggles
// open/closed exactly like the old mock logic did.
export async function logAttendanceScan(userId) {
  const row = await apiFetch('/attendance/log', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
  const uiRow = attendanceFromApi(row);
  const idx = cache.attendance.findIndex(a => a.id === uiRow.id);
  if (idx !== -1) cache.attendance[idx] = uiRow; else cache.attendance.push(uiRow);
  return uiRow;
}

// Kept for API-surface parity with the old mock DB; both now delegate to the
// same server-backed toggle used by the reception scanner.
export async function saveAttendance(record) {
  return logAttendanceScan(record.userId);
}
export async function updateAttendance(record) {
  return logAttendanceScan(record.userId);
}

export async function saveFitnessPlan(plan) {
  const row = await apiFetch('/fitness-plans', {
    method: 'POST',
    body: JSON.stringify({
      customerId: plan.customerId,
      trainerId: plan.trainerId,
      workoutPlan: plan.workoutPlan,
      nutritionPlan: plan.nutritionPlan
    })
  });
  const trainer = cache.users.find(u => u.id === row.trainer_id);
  const uiPlan = planFromApi(row, (trainer && trainer.name) || plan.trainerName);
  const idx = cache.fitnessPlans.findIndex(p => p.customerId === uiPlan.customerId);
  if (idx !== -1) cache.fitnessPlans[idx] = uiPlan; else cache.fitnessPlans.push(uiPlan);
  return uiPlan;
}

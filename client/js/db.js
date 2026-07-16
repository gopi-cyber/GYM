// API Client Layer for Gym Management System (GMS)
import * as db from './db.js';

// API_BASE now derives from the current host so the app works when served
// from any origin without hardcoding localhost.
const API_BASE = `${location.protocol}//${location.host}/api`;

const TOKEN_KEY = 'gms_token';
const USER_KEY = 'gms_user';

let cache = {
  directory: [],
  users: [],
  inventory: [],
  attendance: [],
  fitnessPlans: [],
  plans: [],
  subscription: null,
  adminStats: null,
  adminCompanies: [],
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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

function capitalizeRole(role) {
  if (!role) return role;
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function toApiRole(role) {
  return (role || '').toLowerCase();
}

function safeParse(text) {
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}

function userFromApi(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: capitalizeRole(row.role),
    membership: row.membership,
    joinedDate: row.joined_date || row.joinedDate,
    phone: row.phone || '',
    gymAddress: row.gym_address || '',
    gpsLocation: row.gps_location || '',
    mobileNumber: row.mobile_number || '',
    isAdmin: !!(row.is_admin || row.isAdmin),
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
    lastServiced: row.last_serviced || undefined,
  };
}

function inventoryToApi(item) {
  return {
    name: item.name,
    type: item.type,
    quantity: item.quantity,
    status: item.status,
    threshold: item.threshold === undefined ? null : item.threshold,
    last_serviced: item.lastServiced === undefined ? null : item.lastServiced,
  };
}

function attendanceFromApi(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    checkIn: row.check_in || '',
    checkOut: row.check_out || '',
    duration: row.duration === null || row.duration === undefined ? 0 : row.duration,
  };
}

function planFromApi(row, trainerName) {
  return {
    id: row.id,
    customerId: row.customer_id,
    trainerId: row.trainer_id,
    trainerName: trainerName || '',
    workoutPlan: row.workout_plan || [],
    nutritionPlan: row.nutrition_plan || [],
  };
}

// ---------------------------------------------------------------------------
// Billing / admin client helpers
// ---------------------------------------------------------------------------

export async function loadPlans() {
  const rows = await apiFetch('/plans');
  cache.plans = rows.map(r => ({ ...r, features: safeParse(r.features) }));
  return cache.plans;
}

export function getPlans() {
  return cache.plans;
}

export async function loadCurrentSubscription() {
  cache.subscription = await apiFetch('/subscriptions/current').catch(() => null);
  return cache.subscription;
}

export function getCurrentSubscription() {
  return cache.subscription;
}

export async function checkoutPlan(planSlug) {
  const row = await apiFetch('/subscriptions/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan_slug: planSlug }),
  });
  cache.subscription = row || cache.subscription;
  return row;
}

export async function cancelSubscription(subscriptionId) {
  const row = await apiFetch(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST' });
  cache.subscription = row || cache.subscription;
  return row;
}

export async function loadSubscriptionUsage() {
  return apiFetch('/subscriptions/usage').catch(() => null);
}

export async function loadAdminStats() {
  cache.adminStats = await apiFetch('/admin/stats').catch(() => null);
  return cache.adminStats;
}

export function getAdminStats() {
  return cache.adminStats;
}

export async function loadAdminCompanies() {
  cache.adminCompanies = await apiFetch('/admin/companies').catch(() => []);
  return cache.adminCompanies;
}

export function getAdminCompanies() {
  return cache.adminCompanies;
}

export async function createInvoice(payload) {
  return apiFetch('/admin/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function payInvoice(invoiceId) {
  return apiFetch(`/admin/invoices/${invoiceId}/pay`, { method: 'POST' });
}

export async function loadAdminActions() {
  return apiFetch('/admin/actions').catch(() => []);
}

export function isAdminUser() {
  const u = getCurrentUser();
  return !!(u && u.isAdmin);
}

export async function loadPlanDetails(planId) {
  return apiFetch(`/plans/${planId}`).catch(() => null);
}

// ---------------------------------------------------------------------------
// Init / session loading
// ---------------------------------------------------------------------------

export async function initDB() {
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
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    await loadRoleData(user);
  } catch (e) {
    clearCurrentUser();
  }
}

async function loadRoleData(user) {
  const apiRole = toApiRole(user.role);

  try {
    cache.inventory = (await apiFetch('/inventory')).map(inventoryFromApi);
  } catch (e) {
    cache.inventory = [];
  }

  try {
    cache.attendance = (await apiFetch('/attendance')).map(attendanceFromApi);
  } catch (e) {
    cache.attendance = [];
  }

  if (apiRole === 'owner' || apiRole === 'trainer') {
    try {
      cache.users = (await apiFetch('/users')).map(userFromApi);
    } catch (e) {
      cache.users = [user];
    }
  } else {
    cache.users = [user];
  }

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
        // no plan for this customer yet
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
    body: JSON.stringify({ email, password }),
  });
  setToken(token);
  const uiUser = userFromApi(user);
  localStorage.setItem(USER_KEY, JSON.stringify(uiUser));
  await loadRoleData(uiUser);
  return uiUser;
}

export async function register({ name, email, password, role, companySlug, phone }) {
  const payload = { name, email, password, role: toApiRole(role) };
  if (companySlug) payload.companySlug = companySlug;
  if (phone) payload.phone = phone;
  const { token, user } = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(token);
  const uiUser = userFromApi(user);
  localStorage.setItem(USER_KEY, JSON.stringify(uiUser));
  await loadRoleData(uiUser);
  return uiUser;
}

export function getCurrentUser() {
  const str = localStorage.getItem(USER_KEY);
  return str ? JSON.parse(str) : null;
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  setToken(null);
  localStorage.removeItem(USER_KEY);
  cache = {
    directory: cache.directory,
    users: [],
    inventory: [],
    attendance: [],
    fitnessPlans: [],
    plans: [],
    subscription: null,
    adminStats: null,
    adminCompanies: [],
  };
}

// ---------------------------------------------------------------------------
// Synchronous cache getters used by render code
// ---------------------------------------------------------------------------

export function getDirectory() { return cache.directory; }
export function getUsers() { return cache.users; }
export function getInventory() { return cache.inventory; }
export function getAttendance() { return cache.attendance; }
export function getFitnessPlans() { return cache.fitnessPlans; }

// ---------------------------------------------------------------------------
// Async mutators
// ---------------------------------------------------------------------------

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
      linkedUserId: item.linkedUserId,
    }),
  });
  cache.directory.push(row);
  return row;
}

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
      body: JSON.stringify(inventoryToApi(item)),
    });
  } else {
    row = await apiFetch('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryToApi(item)),
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

export async function logAttendanceScan(userId) {
  const row = await apiFetch('/attendance/log', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  const uiRow = attendanceFromApi(row);
  const idx = cache.attendance.findIndex(a => a.id === uiRow.id);
  if (idx !== -1) cache.attendance[idx] = uiRow; else cache.attendance.push(uiRow);
  return uiRow;
}

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
      nutritionPlan: plan.nutritionPlan,
    }),
  });
  const trainer = cache.users.find(u => u.id === row.trainer_id);
  const uiPlan = planFromApi(row, (trainer && trainer.name) || plan.trainerName);
  const idx = cache.fitnessPlans.findIndex(p => p.customerId === uiPlan.customerId);
  if (idx !== -1) cache.fitnessPlans[idx] = uiPlan; else cache.fitnessPlans.push(uiPlan);
  return uiPlan;
}

export async function updateProfile(fields) {
  const row = await apiFetch('/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const index = cache.users.findIndex(u => u && u.id === row.id);
  if (index !== -1) {
    cache.users[index] = { ...cache.users[index], ...userFromApi(row) };
  } else {
    cache.users.push(userFromApi(row));
  }
  const storedStr = localStorage.getItem(USER_KEY);
  if (storedStr) {
    try {
      const stored = JSON.parse(storedStr);
      const merged = { ...stored, ...userFromApi(row) };
      localStorage.setItem(USER_KEY, JSON.stringify(merged));
    } catch (e) { /* ignore */ }
  }
  return userFromApi(row);
}

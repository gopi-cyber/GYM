// Components Render Engine for Gym Management System (GMS)
import * as db from './db.js';

// SVG Icons as inline helpers
const ICONS = {
  dumbbell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18.5 5.5 3 3"/><path d="m11.5 5.5 7 7"/><path d="m5.5 18.5 3 3"/><path d="m5.5 11.5 7 7"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
  package: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  qr: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v-1"/><path d="M12 7v3"/><path d="M7 12h3"/></svg>`
};

// 1. NAVBAR COMPONENT
export function renderNavbar(currentUser, onNavigate, onSignOut) {
  const header = document.createElement('header');
  header.className = 'navbar';
  
  header.innerHTML = currentUser ? `
    <div class="container">
      <div class="logo" id="nav-logo" style="cursor: pointer;">
        ${ICONS.dumbbell} <span>Vigor</span>GMS
      </div>
      <nav class="nav-links">
        <span class="nav-link" id="nav-dash" style="color: var(--accent-green);">Dashboard</span>
        <button class="nav-profile-avatar-btn" id="nav-auth-btn" aria-label="Open profile menu">
          <img src="${currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || 'User') + '&background=10b981&color=fff'}" alt="${currentUser.name || 'User'}" />
        </button>
        <div id="nav-profile-panel" class="nav-profile-panel" style="display:none;">
          <div class="nav-profile-header">
            <div class="nav-profile-avatar">
              <img src="${currentUser.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name || 'User') + '&background=10b981&color=fff'}" alt="${currentUser.name || 'User'}" />
            </div>
            <div class="nav-profile-meta">
              <div style="font-weight:700; color: var(--text-primary); font-size:14px;">${currentUser.name}</div>
              <div style="font-size:11px; color: var(--text-muted);">${currentUser.email}</div>
              <div style="font-size:11px; color: var(--text-muted); text-transform: capitalize;">${currentUser.role}</div>
            </div>
          </div>
          <div class="nav-profile-menu">
            <button class="nav-profile-menu-item" data-action="profile">
              ${ICONS.user} Your profile
            </button>
            <button class="nav-profile-menu-item" data-action="dashboard">
              ⭐ Dashboard
            </button>
            <button class="nav-profile-menu-item" data-action="settings">
              ⚙️ Settings
            </button>
            <div class="nav-profile-divider"></div>
            <button class="nav-profile-menu-item nav-profile-menu-item--danger" data-action="logout">
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </div>
  ` : `
    <div class="container">
      <div class="logo" id="nav-logo" style="cursor: pointer;">
        ${ICONS.dumbbell} <span>Vigor</span>GMS
      </div>
      <nav class="nav-links">
        <span class="nav-link" id="nav-features">Features</span>
        <span class="nav-link" id="nav-pricing">Pricing</span>
        <span class="nav-link" id="nav-directory">Directories</span>
        <button class="btn-primary" id="nav-auth-btn">${ICONS.user} Sign In</button>
      </nav>
    </div>
  `;

  // Bind Event Listeners
  if (currentUser) {
    header.querySelector('#nav-logo').addEventListener('click', () => onNavigate('dashboard'));
    const dashLink = header.querySelector('#nav-dash');
    if (dashLink) dashLink.addEventListener('click', () => onNavigate('dashboard'));

    const authBtn = header.querySelector('#nav-auth-btn');
    const panel = header.querySelector('#nav-profile-panel');
    let panelOpen = false;

    const openProfilePanel = (e) => {
      e.stopPropagation();
      panelOpen = true;
      panel.style.display = 'block';
      document.addEventListener('click', closeProfilePanelOutside);
    };

    const closeProfilePanelOutside = (e) => {
      if (!header.contains(e.target)) {
        panelOpen = false;
        panel.style.display = 'none';
        document.removeEventListener('click', closeProfilePanelOutside);
      }
    };

    authBtn.addEventListener('click', openProfilePanel);

    panel.querySelectorAll('.nav-profile-menu-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        panelOpen = false;
        panel.style.display = 'none';
        document.removeEventListener('click', closeProfilePanelOutside);

        if (action === 'logout') {
          onSignOut();
        } else if (action === 'profile') {
          showProfileModal(currentUser);
        } else if (action === 'settings') {
          showSettingsModal(currentUser);
        } else if (action === 'dashboard') {
          onNavigate('dashboard');
        }
      });
    });
  } else {
    header.querySelector('#nav-logo').addEventListener('click', () => onNavigate('home'));
    header.querySelector('#nav-features').addEventListener('click', () => {
      onNavigate('home');
      setTimeout(() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    header.querySelector('#nav-pricing').addEventListener('click', () => {
      onNavigate('home');
      setTimeout(() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    header.querySelector('#nav-directory').addEventListener('click', () => {
      onNavigate('home');
      setTimeout(() => document.getElementById('directory-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    header.querySelector('#nav-auth-btn').addEventListener('click', () => onNavigate('auth', 'login'));
  }

  return header;
}

// 2. HERO COMPONENT
export function renderHero(onNavigate, onOpenRegister) {
  const section = document.createElement('section');
  section.className = 'hero container';
  section.innerHTML = `
    <h1 class="hero-title">Forge Your <span>Ultimate Self</span> & Streamline Gym Operations</h1>
    <p class="hero-desc">The high-performance Gym Management System built for owners, trainers, and athletes. Manage schedules, check-ins, medical consults, and workouts in one unified dashboard.</p>
    <div class="hero-ctas">
      <button class="btn-primary" id="hero-get-started">Get Started</button>
      <button class="btn-secondary" id="hero-view-pricing">View Pricing</button>
    </div>
  `;

  // Events
  section.querySelector('#hero-get-started').addEventListener('click', () => onNavigate('auth', 'register'));
  section.querySelector('#hero-view-pricing').addEventListener('click', () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  return section;
}

// 3. FEATURES COMPONENT
export function renderFeatures() {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'features-section';
  
  section.innerHTML = `
    <div class="container">
      <span class="section-tag">Key Modules</span>
      <h2 class="section-title">Engineered For Dynamic Fitness Operations</h2>
      <p class="section-desc">We hit all core pillars: robust attendance tracking, equipment operations, medical directories, and personalized fitness builder portals.</p>
      
      <div class="features-grid">
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper icon-green">${ICONS.qr}</div>
          <h3>QR Check-in & Time Logs</h3>
          <p>Scan unique dashboard QR codes on arrival and departure. Calculates total weekly hours and powers the owner analytics dashboard.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper icon-blue">${ICONS.package}</div>
          <h3>Inventory CRUD Control</h3>
          <p>Track equipment status (Functional, Broken, Maintenance). Set custom threshold limits for low-stock supplement notifications.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper icon-orange">${ICONS.clipboard}</div>
          <h3>Workout & Diet Builder</h3>
          <p>Trainers assign custom weekly workout sheets and structured metabolic diet logs directly to their client's portal.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper icon-green">${ICONS.activity}</div>
          <h3>Medical Consultation</h3>
          <p>Instant access to sports medicine doctors, nutritionists, and physical therapists for customized workout plans.</p>
        </div>
      </div>
    </div>
  `;
  return section;
}

// 4. PRICING COMPONENT
export function renderPricing(onNavigate) {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'pricing-section';
  
  section.innerHTML = `
    <div class="container">
      <span class="section-tag">Pricing Plans</span>
      <h2 class="section-title">Memberships Built For Every Level</h2>
      <p class="section-desc">Unlock customized fitness goals. Choose the perfect tier for you.</p>
      
      <div class="pricing-toggle">
        <span class="toggle-label active" id="billing-monthly">Monthly</span>
        <label class="switch">
          <input type="checkbox" id="pricing-billing-checkbox">
          <span class="slider"></span>
        </label>
        <span class="toggle-label" id="billing-yearly">Yearly (Save 20%)</span>
      </div>
      
      <div class="pricing-grid" id="pricing-cards-container">
        <!-- Cards will load here via javascript -->
      </div>
    </div>
  `;

  // Inner function to load cards
  const loadCards = (isYearly) => {
    const container = section.querySelector('#pricing-cards-container');
    const plans = [
      { name: 'Basic Tier', monthlyPrice: 29, features: ['Access to Gym Floor', 'Locker & Shower access', 'Public Directory view'], popular: false },
      { name: 'Pro Tier', monthlyPrice: 59, features: ['All Basic Features', 'Simulated QR Check-in tracking', 'Custom Workout & Nutrition builder', '1 Trainer Consultation/mo'], popular: true },
      { name: 'Elite Tier', monthlyPrice: 99, features: ['All Pro Features', 'Unlimited Medical Directory consulting', 'Free Supplement cases check', 'Full operation logs access'], popular: false }
    ];

    container.innerHTML = plans.map(p => {
      const price = isYearly ? Math.round(p.monthlyPrice * 0.8) : p.monthlyPrice;
      return `
        <div class="pricing-card glass-panel ${p.popular ? 'popular' : ''}">
          ${p.popular ? `<div class="popular-badge">Most Popular</div>` : ''}
          <div class="plan-name">${p.name}</div>
          <div class="plan-price">$${price}<span>/ month</span></div>
          <ul class="plan-features">
            ${p.features.map(f => `<li>${ICONS.check} ${f}</li>`).join('')}
          </ul>
          <button class="btn-primary auth-trigger-btn" style="width: 100%; margin-top: auto;">Choose Plan</button>
        </div>
      `;
    }).join('');

    // Re-bind triggers to redirect to dedicated auth page
    container.querySelectorAll('.auth-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => onNavigate('auth', 'register'));
    });
  };

  // Initial load
  loadCards(false);

  // Toggle Listener
  const checkbox = section.querySelector('#pricing-billing-checkbox');
  const labelMonthly = section.querySelector('#billing-monthly');
  const labelYearly = section.querySelector('#billing-yearly');

  checkbox.addEventListener('change', (e) => {
    const isYearly = e.target.checked;
    if (isYearly) {
      labelMonthly.classList.remove('active');
      labelYearly.classList.add('active');
    } else {
      labelMonthly.classList.add('active');
      labelYearly.classList.remove('active');
    }
    loadCards(isYearly);
  });

  return section;
}

// 5. DIRECTORY COMPONENT
export function renderDirectory() {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'directory-section';
  
  section.innerHTML = `
    <div class="container">
      <span class="section-tag">Affiliates</span>
      <h2 class="section-title">Certified Gym Trainers & Doctors</h2>
      <p class="section-desc">Connect with our network of professionals for injury rehab, personal conditioning, and medical clearance.</p>
      
      <div class="directory-filters">
        <button class="filter-btn active" data-filter="all">All Professionals</button>
        <button class="filter-btn" data-filter="trainer">Gym Trainers</button>
        <button class="filter-btn" data-filter="doctor">Medical Staff</button>
      </div>
      
      <div class="directory-grid" id="directory-cards-container">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  const renderCards = (filter) => {
    const container = section.querySelector('#directory-cards-container');
    const items = db.getDirectory();
    const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);
    
    container.innerHTML = filtered.map(item => {
      const typeLabel = item.type === 'trainer' ? 'Trainer' : 'Medical Staff';
      const detailInfo = item.type === 'trainer' 
        ? `Experience: ${item.experience}` 
        : `Hospital: ${item.hospital}`;
        
      return `
        <div class="directory-card glass-panel">
          <img class="directory-avatar" src="${item.avatar}" alt="${item.name}">
          <div class="directory-info">
            <span class="directory-type-tag type-${item.type}">${typeLabel}</span>
            <h3>${item.name}</h3>
            <div class="directory-specialty">${item.specialty}</div>
            <div class="directory-hospital">${detailInfo}</div>
            <p class="directory-bio">${item.bio}</p>
            <button class="btn-secondary contact-btn" style="padding: 6px 12px; font-size: 12px;" data-name="${item.name}">Book Consultation</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        alert(`Booking request for ${e.target.dataset.name} sent successfully! They will email you soon.`);
      });
    });
  };

  // Initial load
  renderCards('all');

  // Filter Buttons binding
  section.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      section.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderCards(e.target.dataset.filter);
    });
  });

  return section;
}

// 6. DEDICATED AUTHENTICATION PAGE (Split-panel view)
// 6. DEDICATED AUTHENTICATION PAGE (Split-panel view with Split registration forms)
export function renderAuthPage(onAuthSuccess, initialMode = 'login') {
  const container = document.createElement('div');
  container.className = 'auth-page-container';
  
  container.innerHTML = `
    <!-- Left Column: Visual Banner -->
    <div class="auth-left-banner">
      <h2>VigorGMS Operations Portal</h2>
      <p>Forge your ultimate athletic self while managing all member schedules, inventories, time logs, and wellness directories in a single visual panel.</p>
      <ul class="auth-feature-list">
        <li class="auth-feature-item">
          ${ICONS.check} Simulated Reception QR Check-ins & Duration Logs
        </li>
        <li class="auth-feature-item">
          ${ICONS.check} Comprehensive Equipment CRUD & Consumable Alerts
        </li>
        <li class="auth-feature-item">
          ${ICONS.check} Drag-and-Drop Workout Schedules & Structured Nutrition Builders
        </li>
        <li class="auth-feature-item">
          ${ICONS.check} Sports Medicine Doctor & certified Trainer Directories
        </li>
      </ul>
    </div>
    
    <!-- Right Column: Interactive Forms -->
    <div class="auth-right-form">
      <div class="auth-card glass-panel" style="background: #ffffff !important;">
        <div class="modal-tabs" style="margin-bottom: 24px;">
          <div class="modal-tab" id="tab-login" data-tab="login">Sign In</div>
          <div class="modal-tab" id="tab-register" data-tab="register">Sign Up</div>
        </div>
        
        <div class="auth-error" id="auth-error-box">Invalid credentials</div>
        
        <!-- LOGIN FORM -->
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-input" id="login-email" required placeholder="eg. admin@gms.com">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="login-password" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn-primary auth-submit-btn">Login</button>
        </form>
        
        <!-- REGISTRATION ROLE CHOICE SCREEN -->
        <div id="reg-role-selection" style="display: none;">
          <h3 class="auth-card-title" style="font-size: 20px; margin-bottom: 8px; text-align: center;">Create an Account</h3>
          <p class="auth-card-desc" style="margin-bottom: 20px; text-align: center;">Select your role to get started</p>
          <div class="role-selection-grid">
            <div class="role-card" data-role="Customer" style="cursor: pointer;">
              <div class="role-card-icon" style="color: var(--accent-green);">${ICONS.user}</div>
              <div class="role-card-info">
                <h4 style="color: var(--accent-green);">Join as Customer</h4>
                <p>Access the gym floor, scan QR check-ins, track workouts, and consult physical specialists.</p>
              </div>
            </div>
            <div class="role-card" data-role="Trainer" style="cursor: pointer;">
              <div class="role-card-icon" style="color: var(--accent-blue);">${ICONS.dumbbell}</div>
              <div class="role-card-info">
                <h4 style="color: var(--accent-blue);">Join as Trainer</h4>
                <p>Configure weekly routines and dietary guides for clients and appear in the certified coach list.</p>
              </div>
            </div>
            <div class="role-card" data-role="Owner" style="cursor: pointer;">
              <div class="role-card-icon" style="color: var(--accent-orange);">${ICONS.activity}</div>
              <div class="role-card-info">
                <h4 style="color: var(--accent-orange);">Join as Gym Owner</h4>
                <p>Register as administrator to track real-time attendance logs, view financial stats, and audit supply stock.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FORM 1: CUSTOMER SIGN UP -->
        <form id="register-customer-form" style="display: none;">
          <button type="button" class="back-to-roles-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Roles
          </button>
          
          <h3 style="font-size: 18px; margin-bottom: 15px; color: var(--accent-green);">Customer Registration</h3>
          
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="cust-name" required placeholder="John Doe">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="cust-email" required placeholder="john@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="cust-password" required placeholder="••••••••">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Company / Gym Slug</label>
            <input type="text" class="form-input" id="cust-company-slug" required placeholder="eg. vigorgms-koramangala">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" id="cust-phone" required placeholder="+91 98765 43210">
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-input" id="cust-dob" required>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-input" id="cust-gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Membership Plan</label>
              <select class="form-input" id="cust-membership">
                <option value="Basic">Basic Tier ($29/mo)</option>
                <option value="Pro" selected>Pro Tier ($59/mo)</option>
                <option value="Elite">Elite Tier ($99/mo)</option>
              </select>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Emergency Contact Name</label>
              <input type="text" class="form-input" id="cust-emergency-name" required placeholder="Name">
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Phone</label>
              <input type="tel" class="form-input" id="cust-emergency-phone" required placeholder="Phone">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Medical Conditions / Injuries (Optional)</label>
            <textarea class="form-input" id="cust-medical" rows="2" placeholder="e.g. Lower back pain, asthma, or none"></textarea>
          </div>
          
          <button type="submit" class="btn-primary auth-submit-btn">Create Account</button>
        </form>

        <!-- FORM 2: TRAINER SIGN UP -->
        <form id="register-trainer-form" style="display: none;">
          <button type="button" class="back-to-roles-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Roles
          </button>
          
          <h3 style="font-size: 18px; margin-bottom: 15px; color: var(--accent-blue);">Trainer Registration</h3>
          
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="trainer-name" required placeholder="Coach Vicky">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="trainer-email" required placeholder="vicky@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="trainer-password" required placeholder="••••••••">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Company / Gym Slug</label>
            <input type="text" class="form-input" id="trainer-company-slug" required placeholder="eg. vigorgms-koramangala">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" id="trainer-phone" required placeholder="+91 98765 43210">
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-input" id="trainer-dob" required>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-input" id="trainer-gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Specialty / Expert Field</label>
              <input type="text" class="form-input" id="trainer-specialty" required placeholder="e.g. Strength & Conditioning">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Years of Experience</label>
            <input type="text" class="form-input" id="trainer-experience" required placeholder="e.g. 5 Years">
          </div>

          <div class="form-group">
            <label class="form-label">Bio / Profile Description</label>
            <textarea class="form-input" id="trainer-bio" rows="2" required placeholder="e.g. Dedicated to powerlifting and athletic preparation."></textarea>
          </div>
          
          <button type="submit" class="btn-primary auth-submit-btn" style="background-color: var(--accent-blue);">Create Account</button>
        </form>

        <!-- FORM 3: OWNER SIGN UP -->
        <form id="register-owner-form" style="display: none;">
          <button type="button" class="back-to-roles-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to Roles
          </button>
          
          <h3 style="font-size: 18px; margin-bottom: 15px; color: var(--accent-orange);">Owner/Admin Registration</h3>
          
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="owner-name" required placeholder="Admin Owner">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-input" id="owner-email" required placeholder="owner@gms.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="owner-password" required placeholder="••••••••">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-input" id="owner-phone" required placeholder="+91 98765 43210">
            </div>
            <div class="form-group">
              <label class="form-label">Gym Name</label>
              <input type="text" class="form-input" id="owner-gym-name" required placeholder="e.g. Vigor Gym Elite">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Gym Location / Address</label>
            <input type="text" class="form-input" id="owner-gym-address" required placeholder="e.g. 5th Avenue, Metro City">
          </div>

          <div class="form-group">
            <label class="form-label">Admin Access Key</label>
            <input type="password" class="form-input" id="owner-key" required placeholder="Security key (default: OWNER123)">
          </div>
          
          <button type="submit" class="btn-primary auth-submit-btn" style="background-color: var(--accent-orange);">Create Account</button>
        </form>

      </div>
    </div>
  `;

  // DOM references
  const tabLogin = container.querySelector('#tab-login');
  const tabRegister = container.querySelector('#tab-register');
  const loginForm = container.querySelector('#login-form');
  const roleSelection = container.querySelector('#reg-role-selection');
  const custForm = container.querySelector('#register-customer-form');
  const trainerForm = container.querySelector('#register-trainer-form');
  const ownerForm = container.querySelector('#register-owner-form');
  const errorBox = container.querySelector('#auth-error-box');

  let activeRegRole = null; // 'Customer', 'Trainer', 'Owner'

  const switchTab = (mode) => {
    errorBox.style.display = 'none';
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      roleSelection.style.display = 'none';
      custForm.style.display = 'none';
      trainerForm.style.display = 'none';
      ownerForm.style.display = 'none';
    } else {
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
      loginForm.style.display = 'none';
      if (activeRegRole === 'Customer') {
        custForm.style.display = 'block';
      } else if (activeRegRole === 'Trainer') {
        trainerForm.style.display = 'block';
      } else if (activeRegRole === 'Owner') {
        ownerForm.style.display = 'block';
      } else {
        roleSelection.style.display = 'block';
      }
    }
  };

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  // Role Selection card bindings
  container.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', (e) => {
      activeRegRole = card.getAttribute('data-role');
      switchTab('register');
    });
  });

  // Back button bindings
  container.querySelectorAll('.back-to-roles-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRegRole = null;
      custForm.style.display = 'none';
      trainerForm.style.display = 'none';
      ownerForm.style.display = 'none';
      roleSelection.style.display = 'block';
      errorBox.style.display = 'none';
    });
  });

  // Init mode
  switchTab(initialMode);

  // Login Submit Action - now calls the real /api/auth/login endpoint.
  // Passwords are hashed server-side, so there is no client-enumerable user
  // list to check against anymore; errors come back as JSON from the API.
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    const email = container.querySelector('#login-email').value;
    const pass = container.querySelector('#login-password').value;

    const submitBtn = loginForm.querySelector('.auth-submit-btn');
    submitBtn.disabled = true;
    try {
      const user = await db.login(email, pass);
      onAuthSuccess(user);
    } catch (err) {
      errorBox.textContent = err.message || 'Invalid email or password.';
      errorBox.style.display = 'block';
      window.scrollTo(0, 0);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Form 1: Customer Register Submit
  custForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    
    const name = container.querySelector('#cust-name').value;
    const email = container.querySelector('#cust-email').value;
    const pass = container.querySelector('#cust-password').value;
    const companySlug = container.querySelector('#cust-company-slug').value;

    const submitBtn = custForm.querySelector('.auth-submit-btn');
    submitBtn.disabled = true;
    try {
      const user = await db.register({ name, email, password: pass, role: 'customer', companySlug });
      onAuthSuccess(user);
    } catch (err) {
      errorBox.textContent = err.message || 'Registration failed.';
      errorBox.style.display = 'block';
      window.scrollTo(0, 0);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Form 2: Trainer Register Submit
  trainerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    
    const name = container.querySelector('#trainer-name').value;
    const email = container.querySelector('#trainer-email').value;
    const pass = container.querySelector('#trainer-password').value;
    const specialty = container.querySelector('#trainer-specialty').value;
    const experience = container.querySelector('#trainer-experience').value;
    const bio = container.querySelector('#trainer-bio').value;
    const companySlug = container.querySelector('#trainer-company-slug').value;

    const submitBtn = trainerForm.querySelector('.auth-submit-btn');
    submitBtn.disabled = true;
    try {
      const user = await db.register({ name, email, password: pass, role: 'trainer', companySlug });

      // Also add to the public homepage certified-professionals directory.
      // This is a separate authenticated call (POST /api/directory, owner
      // only on the server) - a freshly registered trainer isn't an owner,
      // so this will 403 and is wrapped to fail soft rather than blocking
      // the signup flow itself.
      try {
        await db.saveDirectoryItem({
          name,
          type: 'trainer',
          specialty,
          experience,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          bio,
          linkedUserId: user.id
        });
      } catch (dirErr) {
        console.warn('Could not auto-list new trainer in public directory (owner-only endpoint):', dirErr.message);
      }

      onAuthSuccess(user);
    } catch (err) {
      errorBox.textContent = err.message || 'Registration failed.';
      errorBox.style.display = 'block';
      window.scrollTo(0, 0);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Form 3: Owner Register Submit
  // NOTE: the backend's /auth/register endpoint only allows 'customer' or
  // 'trainer' for self-registration (owner accounts must be seeded/created
  // directly in the DB - see server/src/seed.js). This form's "Admin Access
  // Key" gate is preserved as a client-side UX affordance, but since the
  // API can't actually create an owner account through this path, submitting
  // is treated as an error rather than silently downgrading the role.
  ownerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const accessKey = container.querySelector('#owner-key').value;
    if (accessKey !== 'OWNER123') {
      errorBox.textContent = 'Invalid Admin Access Key! Contact system support.';
      errorBox.style.display = 'block';
      window.scrollTo(0, 0);
      return;
    }

    errorBox.textContent = 'Owner accounts cannot self-register. Please contact the system administrator or use a seeded owner account (e.g. admin@gms.com).';
    errorBox.style.display = 'block';
    window.scrollTo(0, 0);
  });

  return container;
}

// 7. DASHBOARDS COMPONENT
export function renderDashboard(user, onNavigate) {
  const container = document.createElement('div');
  container.className = 'dashboard-layout container';

  // Dashboard Header
  const header = document.createElement('div');
  header.className = 'dashboard-header glass-panel';
  header.style.padding = '24px';
  header.style.marginBottom = '30px';
  
  let badgeClass = 'badge-customer';
  if (user.role === 'Owner') badgeClass = 'badge-owner';
  else if (user.role === 'Trainer') badgeClass = 'badge-trainer';

  header.innerHTML = `
    <div class="dashboard-title">
      <h1>Welcome back, ${user.name}</h1>
      <p>Logged in as: <span class="role-badge ${badgeClass}">${user.role}</span></p>
    </div>
    <div>
      <button class="btn-secondary" id="dash-logout">Logout</button>
    </div>
  `;
  header.querySelector('#dash-logout').addEventListener('click', () => onSignOut());
  container.appendChild(header);

  // Render role specific views
  if (user.role === 'Customer') {
    container.appendChild(renderCustomerView(user));
  } else if (user.role === 'Trainer') {
    container.appendChild(renderTrainerView(user));
  } else if (user.role === 'Owner') {
    container.appendChild(renderOwnerView(user));
  }

  return container;
}

/* ========================================================
   CUSTOMER DASHBOARD VIEW
   ======================================================== */
function renderCustomerView(user) {
  const div = document.createElement('div');
  
  // Analytics row
  const attendances = db.getAttendance().filter(a => a.userId === user.id);
  const totalCheckIns = attendances.length;
  const totalHours = attendances.reduce((acc, curr) => acc + (curr.duration || 0), 0).toFixed(1);

  div.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card glass-panel">
        <div class="label">Membership Tier</div>
        <div class="value" style="color: var(--accent-green);">${user.membership || 'Pro'}</div>
        <div class="meta">Joined: ${user.joinedDate}</div>
      </div>
      <div class="analytics-card glass-panel">
        <div class="label">Total Gym Check-ins</div>
        <div class="value">${totalCheckIns} Times</div>
        <div class="meta">All-time logs</div>
      </div>
      <div class="analytics-card glass-panel">
        <div class="label">Total Training Hours</div>
        <div class="value">${totalHours} Hrs</div>
        <div class="meta">Average ~1.5h per session</div>
      </div>
    </div>

    <div class="dashboard-tabs">
      <button class="dash-tab-btn active" id="cust-tab-qr">My Check-In QR</button>
      <button class="dash-tab-btn" id="cust-tab-plans">Workout & Nutrition Plan</button>
      <button class="dash-tab-btn" id="cust-tab-history">Check-In History</button>
    </div>

    <div id="customer-tab-content">
      <!-- Loaded Dynamically -->
    </div>
  `;

  const contentArea = div.querySelector('#customer-tab-content');

  // Loader sub-views
  const loadTab = (tabId) => {
    // Reset buttons
    div.querySelectorAll('.dash-tab-btn').forEach(btn => btn.classList.remove('active'));
    div.querySelector(`#cust-tab-${tabId}`).classList.add('active');

    if (tabId === 'qr') {
      const scanToken = `GMS-QR-${user.id}-${Date.now().toString().slice(-4)}`;
      contentArea.innerHTML = `
        <div class="qr-simulate-card glass-panel">
          <h3>Your Member Entry Barcode</h3>
          <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">Present this scanner token at the reception desk to sign in/out.</p>
          <div class="qr-box">
            <!-- Represent a beautiful simulated pixelated matrix barcode -->
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; width: 100%; height: 100%;">
              ${Array.from({length: 25}).map(() => `<div style="background-color: ${Math.random() > 0.45 ? '#000' : '#e2e8f0'}; border-radius: 2px;"></div>`).join('')}
            </div>
          </div>
          <div class="qr-simulate-code">${scanToken}</div>
          <button class="btn-primary" id="copy-qr-token" data-token="${scanToken}">Copy Scan Token</button>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 12px;">Copy this token to simulate a front-desk scanner arrival check-in inside the Owner Portal.</p>
        </div>
      `;
      contentArea.querySelector('#copy-qr-token').addEventListener('click', (e) => {
        navigator.clipboard.writeText(e.target.dataset.token);
        alert('QR code scanner token copied to clipboard! Switch account and log in as "admin@gms.com" to scan it.');
      });

    } else if (tabId === 'plans') {
      const plans = db.getFitnessPlans();
      const userPlan = plans.find(p => p.customerId === user.id);

      if (!userPlan) {
        contentArea.innerHTML = `
          <div class="glass-panel" style="padding: 40px; text-align: center;">
            <p style="color: var(--text-secondary); margin-bottom: 12px;">No active training plans assigned to you yet.</p>
            <p style="font-size: 13px; color: var(--text-muted);">Speak with your coach <strong>${db.getDirectory()[0].name}</strong> to initialize a weekly training regimen.</p>
          </div>
        `;
        return;
      }

      contentArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 30px;">
          <!-- Workout Schedule -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="margin-bottom: 20px; color: var(--accent-green); display: flex; align-items: center; gap: 8px;">
              ${ICONS.dumbbell} Weekly Workout Schedule
            </h3>
            <div class="workout-days-grid">
              ${userPlan.workoutPlan.map(w => `
                <div class="day-card glass-panel" style="background: rgba(255,255,255,0.01);">
                  <h4>${w.day}</h4>
                  <span class="focus">${w.focus}</span>
                  <p>${w.exercises}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Nutrition Program -->
          <div class="glass-panel" style="padding: 24px;">
            <h3 style="margin-bottom: 20px; color: var(--accent-blue); display: flex; align-items: center; gap: 8px;">
              ${ICONS.activity} Dietary Nutrition Logs
            </h3>
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Meal Target</th>
                    <th>Diet Plan Recipe & Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  ${userPlan.nutritionPlan.map(n => `
                    <tr>
                      <td style="font-weight: 600; color: var(--text-primary);">${n.meal}</td>
                      <td>${n.detail}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

    } else if (tabId === 'history') {
      const clientLogs = db.getAttendance()
        .filter(a => a.userId === user.id)
        .sort((a,b) => b.date.localeCompare(a.date));

      if (clientLogs.length === 0) {
        contentArea.innerHTML = `
          <div class="glass-panel" style="padding: 40px; text-align: center; color: var(--text-secondary);">
            No attendance history recorded yet.
          </div>
        `;
        return;
      }

      contentArea.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="margin-bottom: 20px;">Daily Check-In logs</h3>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Duration (Hours)</th>
                </tr>
              </thead>
              <tbody>
                ${clientLogs.map(log => `
                  <tr>
                    <td>${log.date}</td>
                    <td>${log.checkIn}</td>
                    <td>${log.checkOut || 'Active'}</td>
                    <td>${log.duration ? `${log.duration} hrs` : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  };

  // Init default sub-tab
  loadTab('qr');

  // Event handlers
  div.querySelector('#cust-tab-qr').addEventListener('click', () => loadTab('qr'));
  div.querySelector('#cust-tab-plans').addEventListener('click', () => loadTab('plans'));
  div.querySelector('#cust-tab-history').addEventListener('click', () => loadTab('history'));

  return div;
}

/* ========================================================
   TRAINER DASHBOARD VIEW
   ======================================================== */
function renderTrainerView(trainerUser) {
  const div = document.createElement('div');
  
  // Clients available inside system
  const clients = db.getUsers().filter(u => u.role === 'Customer');
  let selectedClientId = clients[0]?.id || '';

  div.innerHTML = `
    <div class="plan-editor">
      <!-- Clients Panel -->
      <div class="glass-panel" style="padding: 24px; height: fit-content;">
        <h3 style="margin-bottom: 20px; font-size: 18px;">Assigned Clients</h3>
        <div class="client-list" id="trainer-client-list">
          <!-- Loaded JS -->
        </div>
      </div>

      <!-- Plan editing dashboard -->
      <div class="glass-panel" style="padding: 24px;" id="trainer-editor-panel">
        <!-- Renders based on active client selection -->
      </div>
    </div>
  `;

  const renderClients = () => {
    const listContainer = div.querySelector('#trainer-client-list');
    const plans = db.getFitnessPlans();
    
    listContainer.innerHTML = clients.map(c => {
      const hasPlan = plans.some(p => p.customerId === c.id);
      return `
        <div class="client-item glass-panel ${c.id === selectedClientId ? 'active' : ''}" data-id="${c.id}">
          <div>
            <div class="client-name">${c.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${c.email}</div>
          </div>
          <span class="client-plan-status" style="color: ${hasPlan ? 'var(--accent-green)' : 'var(--accent-orange)'}">
            ${hasPlan ? 'Plan Active' : 'No Plan'}
          </span>
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.client-item').forEach(item => {
      item.addEventListener('click', (e) => {
        selectedClientId = e.currentTarget.dataset.id;
        renderClients();
        renderActiveEditor();
      });
    });
  };

  const renderActiveEditor = () => {
    const editor = div.querySelector('#trainer-editor-panel');
    const client = clients.find(c => c.id === selectedClientId);

    if (!client) {
      editor.innerHTML = `<p style="color: var(--text-secondary);">No client selected or registered.</p>`;
      return;
    }

    const plans = db.getFitnessPlans();
    let currentPlan = plans.find(p => p.customerId === client.id);

    // Initial default structured empty format
    if (!currentPlan) {
      currentPlan = {
        customerId: client.id,
        trainerId: trainerUser.id,
        trainerName: trainerUser.name,
        workoutPlan: [
          { day: 'Monday', focus: 'Chest & Arms', exercises: 'Exercises here...' },
          { day: 'Wednesday', focus: 'Legs & Core', exercises: 'Exercises here...' },
          { day: 'Friday', focus: 'Back & Shoulders', exercises: 'Exercises here...' }
        ],
        nutritionPlan: [
          { meal: 'Breakfast', detail: 'Food Details...' },
          { meal: 'Lunch', detail: 'Food Details...' },
          { meal: 'Snack', detail: 'Food Details...' },
          { meal: 'Dinner', detail: 'Food Details...' }
        ]
      };
    }

    editor.innerHTML = `
      <h3 style="margin-bottom: 24px;">Configure Plan for <span style="color: var(--accent-green);">${client.name}</span></h3>
      
      <form id="save-plan-form">
        <h4 style="color: var(--accent-green); margin-bottom: 12px; font-size: 15px;">Workout Structure</h4>
        ${currentPlan.workoutPlan.map((w, idx) => `
          <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-bottom: 12px; align-items: start;">
            <div style="font-weight: 600; font-size: 13px; margin-top: 8px;">${w.day} (${w.focus})</div>
            <textarea class="form-input" id="workout-day-${idx}" rows="2" style="font-size:12px; line-height: 1.4;">${w.exercises}</textarea>
          </div>
        `).join('')}

        <h4 style="color: var(--accent-blue); margin-top: 24px; margin-bottom: 12px; font-size: 15px;">Nutrition Program</h4>
        ${currentPlan.nutritionPlan.map((n, idx) => `
          <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-bottom: 12px; align-items: start;">
            <div style="font-weight: 600; font-size: 13px; margin-top: 8px;">${n.meal}</div>
            <input type="text" class="form-input" id="nutrition-meal-${idx}" style="font-size:12px;" value="${n.detail}">
          </div>
        `).join('')}

        <button type="submit" class="btn-primary" style="margin-top: 20px;">Save client Regimen</button>
      </form>
    `;

    // Save Action
    editor.querySelector('#save-plan-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const updatedWorkout = currentPlan.workoutPlan.map((w, idx) => ({
        day: w.day,
        focus: w.focus,
        exercises: editor.querySelector(`#workout-day-${idx}`).value
      }));

      const updatedNutrition = currentPlan.nutritionPlan.map((n, idx) => ({
        meal: n.meal,
        detail: editor.querySelector(`#nutrition-meal-${idx}`).value
      }));

      const finalPlan = {
        customerId: client.id,
        trainerId: trainerUser.id,
        trainerName: trainerUser.name,
        workoutPlan: updatedWorkout,
        nutritionPlan: updatedNutrition
      };

      await db.saveFitnessPlan(finalPlan);
      alert(`Regimen assigned to ${client.name} updated successfully!`);
      renderClients();
    });
  };

  renderClients();
  renderActiveEditor();

  return div;
}

/* ========================================================
   OWNER (ADMIN) DASHBOARD VIEW
   ======================================================== */
function renderOwnerView(ownerUser) {
  const div = document.createElement('div');

  // Helpers to calculate indicators
  const calculateDashboardData = () => {
    const users = db.getUsers();
    const totalMembers = users.filter(u => u.role === 'Customer').length;
    const totalTrainers = users.filter(u => u.role === 'Trainer').length;

    // Active Check-Ins (Check In has no Check Out yet)
    const logs = db.getAttendance();
    const activeLogs = logs.filter(l => !l.checkOut);

    // Low stock items count
    const inventory = db.getInventory();
    const lowStockCount = inventory.filter(i => i.threshold != null && i.quantity <= i.threshold).length;

    return { totalMembers, totalTrainers, activeCheckins: activeLogs.length, lowStockCount, inventory, logs };
  };

  const data = calculateDashboardData();

  div.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card glass-panel">
        <div class="label">Customers</div>
        <div class="value">${data.totalMembers}</div>
        <div class="meta">Registered Customers</div>
      </div>
      <div class="analytics-card glass-panel">
        <div class="label">Personal Trainers</div>
        <div class="value">${data.totalTrainers}</div>
        <div class="meta">Affiliated Staff</div>
      </div>
      <div class="analytics-card glass-panel">
        <div class="label">Active Gym Entries</div>
        <div class="value" style="color: var(--accent-green);">${data.activeCheckins}</div>
        <div class="meta">On floor right now</div>
      </div>
      <div class="analytics-card glass-panel">
        <div class="label">Low Stock Alerts</div>
        <div class="value ${data.lowStockCount > 0 ? 'warning' : ''}" style="color: ${data.lowStockCount > 0 ? 'var(--accent-orange)' : 'var(--text-primary)'}">
          ${data.lowStockCount} Items
        </div>
        <div class="meta">Threshold exceeded</div>
      </div>
    </div>

    <!-- Low Stock alerts banner -->
    <div id="owner-lowstock-alert-box">
      <!-- Loaded dynamically if count > 0 -->
    </div>

    <div class="dashboard-tabs">
      <button class="dash-tab-btn active" id="owner-tab-reception">Reception desk Scanner</button>
      <button class="dash-tab-btn" id="owner-tab-analytics">Peak Hours Analytics</button>
      <button class="dash-tab-btn" id="owner-tab-inventory">Inventory Management</button>
      <button class="dash-tab-btn" id="owner-tab-trainers">Trainers</button>
      <button class="dash-tab-btn" id="owner-tab-customers">Customers</button>
    </div>

    <div id="owner-tab-content" style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Main Content loaded dynamically -->
    </div>
  `;

  const alertBox = div.querySelector('#owner-lowstock-alert-box');
  const contentArea = div.querySelector('#owner-tab-content');

  // Low stock check
  const renderAlerts = () => {
    const inv = db.getInventory();
    const lowItems = inv.filter(i => i.threshold != null && i.quantity <= i.threshold);
    if (lowItems.length > 0) {
      alertBox.innerHTML = `
        <div class="low-stock-alert">
          ${ICONS.alert} 
          <span><strong>Low stock warning:</strong> ${lowItems.map(item => `${item.name} (${item.quantity} left)`).join(', ')} require replenishment!</span>
        </div>
      `;
    } else {
      alertBox.innerHTML = '';
    }
  };

  const loadOwnerTab = (tabId) => {
    div.querySelectorAll('.dash-tab-btn').forEach(btn => btn.classList.remove('active'));
    div.querySelector(`#owner-tab-${tabId}`).classList.add('active');

    if (tabId === 'reception') {
      contentArea.innerHTML = `
        <div class="glass-panel scanner-container">
          <h3 style="display: flex; align-items: center; gap: 8px; justify-content: center;">
            ${ICONS.qr} Simulated Front Desk QR Scanner
          </h3>
          <p style="color: var(--text-secondary); text-align: center; font-size: 13px; margin-bottom: 12px;">
            Paste a member barcode scanner token (e.g. <code>GMS-QR-u3-xxxx</code>) below, or select a customer from the helper shortcut to process check-in/out logs.
          </p>
          
          <div class="form-group">
            <label class="form-label">Fast Select Customer (Shortcut)</label>
            <select class="form-input" id="owner-scan-shortcut">
              <option value="">-- Choose member --</option>
              ${db.getUsers().filter(u => u.role === 'Customer').map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Scanner Input Token</label>
            <input type="text" class="form-input" id="owner-scanner-input" placeholder="GMS-QR-[id]-[timestamp]">
          </div>

          <button class="btn-primary" id="owner-scanner-submit" style="width:100%;">Scan Member QR</button>
        </div>

        <div class="glass-panel" style="padding: 24px;">
          <h3>Today's Check-In Log entries</h3>
          <div class="data-table-wrapper" style="margin-top: 15px;">
            <table class="data-table" id="owner-reception-log-table">
              <!-- Rendered JS -->
            </table>
          </div>
        </div>
      `;

      const shortcutSelect = contentArea.querySelector('#owner-scan-shortcut');
      const scanInput = contentArea.querySelector('#owner-scanner-input');
      const scanButton = contentArea.querySelector('#owner-scanner-submit');

      shortcutSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          scanInput.value = `GMS-QR-${e.target.value}-${Date.now().toString().slice(-4)}`;
        } else {
          scanInput.value = '';
        }
      });

      const renderLogTable = () => {
        const logs = db.getAttendance();
        const users = db.getUsers();
        const table = contentArea.querySelector('#owner-reception-log-table');
        
        // Filter logs to match today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(l => l.date === todayStr).sort((a,b) => b.checkIn.localeCompare(a.checkIn));

        if (todayLogs.length === 0) {
          table.innerHTML = `<tr><td style="text-align: center; color: var(--text-muted); padding: 30px;">No gym check-ins logged today.</td></tr>`;
          return;
        }

        table.innerHTML = `
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Check-in Time</th>
              <th>Check-out Time</th>
              <th>Session Duration</th>
            </tr>
          </thead>
          <tbody>
            ${todayLogs.map(log => {
              const u = users.find(x => x.id === log.userId) || { name: 'Unknown Member' };
              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-primary);">${u.name}</td>
                  <td>${log.checkIn}</td>
                  <td>${log.checkOut || `<span style="color: var(--accent-green); animation: pulse 2s infinite;">Active on Floor</span>`}</td>
                  <td>${log.duration ? `${log.duration} hrs` : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        `;
      };

      const handleScan = async () => {
        const token = scanInput.value.trim();
        if (!token || !token.startsWith('GMS-QR-')) {
          alert('Error: Invalid token format! Use GMS-QR-[userId]-[suffix]');
          return;
        }

        const parts = token.split('-');
        // NOTE: real user IDs are UUIDs (which themselves contain dashes),
        // so naive `token.split('-')[2]` (fine for the old mock's short
        // 'u1'/'u2'/'u3' ids) breaks against real API ids. Strip the
        // "GMS-QR-" prefix and the trailing "-<timestamp>" suffix instead,
        // and treat everything in between as the userId.
        const userId = token.slice('GMS-QR-'.length, token.lastIndexOf('-'));
        
        const users = db.getUsers();
        const userExists = users.find(u => u.id === userId);

        if (!userExists) {
          alert('Error: Member record not found for this token.');
          return;
        }

        scanButton.disabled = true;
        try {
          // Server-side POST /api/attendance/log toggles open/close for the
          // given userId (mirrors the old mock's manual open/close logic,
          // but now persisted server-side instead of hand-rolled here).
          const updated = await db.logAttendanceScan(userId);
          if (updated.checkOut) {
            alert(`${userExists.name} checked out successfully. Duration: ${updated.duration} hours.`);
          } else {
            alert(`${userExists.name} checked in successfully at ${updated.checkIn}.`);
          }
        } catch (err) {
          alert(`Error: ${err.message || 'Could not process check-in/out.'}`);
          return;
        } finally {
          scanButton.disabled = false;
        }

        // Reset input fields
        scanInput.value = '';
        shortcutSelect.value = '';
        renderLogTable();
        
        // Refresh analytic count dashboard metrics
        const updatedStats = calculateDashboardData();
        div.querySelector('.analytics-grid').children[2].querySelector('.value').textContent = updatedStats.activeCheckins;
      };

      scanButton.addEventListener('click', handleScan);
      renderLogTable();

    } else if (tabId === 'analytics') {
      // Aggregate attendance to find peak hours
      const logs = db.getAttendance();
      
      // Hourly bins: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
      const hoursMap = {
        '6 AM': 0, '7 AM': 0, '8 AM': 0, '9 AM': 0, '10 AM': 0, '11 AM': 0, 
        '12 PM': 0, '5 PM': 0, '6 PM': 0, '7 PM': 0, '8 PM': 0, '9 PM': 0
      };

      logs.forEach(log => {
        if (!log.checkIn) return;
        const hour = parseInt(log.checkIn.split(':')[0]);
        if (hour === 6) hoursMap['6 AM']++;
        else if (hour === 7) hoursMap['7 AM']++;
        else if (hour === 8) hoursMap['8 AM']++;
        else if (hour === 9) hoursMap['9 AM']++;
        else if (hour === 10) hoursMap['10 AM']++;
        else if (hour === 11) hoursMap['11 AM']++;
        else if (hour === 12) hoursMap['12 PM']++;
        else if (hour === 17) hoursMap['5 PM']++;
        else if (hour === 18) hoursMap['6 PM']++;
        else if (hour === 19) hoursMap['7 PM']++;
        else if (hour === 20) hoursMap['8 PM']++;
        else if (hour === 21) hoursMap['9 PM']++;
      });

      // Find max count to scale height of bars
      const maxVal = Math.max(...Object.values(hoursMap), 1);

      contentArea.innerHTML = `
        <div class="glass-panel chart-container">
          <div class="chart-title">Peak Gym Entry Hours (Check-In Aggregation)</div>
          <div class="chart-bars">
            ${Object.entries(hoursMap).map(([label, val]) => {
              const heightPct = Math.round((val / maxVal) * 100);
              return `
                <div class="chart-bar-wrapper">
                  <div class="chart-bar" style="height: ${heightPct}%;" data-val="${val}"></div>
                  <div class="chart-label">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
          <p style="font-size:12px; color: var(--text-muted); margin-top:20px; text-align: center;">
            Morning (7 AM - 9 AM) and Evening (6 PM - 8 PM) represent peak occupancy clusters. Use this information to assign front desk roster shifts.
          </p>
        </div>
      `;

    } else if (tabId === 'inventory') {
      contentArea.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>Gym Assets & Stock Ledger</h3>
            <button class="btn-primary" id="owner-add-inv-btn" style="padding: 8px 16px; font-size: 13px;">Add New Asset</button>
          </div>

          <!-- Add Asset Form Panel (Hidden by default) -->
          <div class="glass-panel" id="add-inv-form-panel" style="display: none; padding: 20px; margin-bottom: 24px; border-color: var(--accent-green);">
            <h4 style="margin-bottom: 15px;">New Asset Registry</h4>
            <form id="new-inventory-form">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">Asset Name</label>
                  <input type="text" class="form-input" id="new-inv-name" required placeholder="eg. Dumbbell Rack">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">Type</label>
                  <select class="form-input" id="new-inv-type">
                    <option value="equipment">Equipment</option>
                    <option value="subliment">Supplement (Subliment)</option>
                  </select>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">Quantity</label>
                  <input type="number" class="form-input" id="new-inv-qty" required value="1" min="1" onfocus="this.select()">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">Initial Status</label>
                  <select class="form-input" id="new-inv-status">
                    <option value="Functional">Functional</option>
                    <option value="Broken">Broken</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label">Low Stock Threshold</label>
                  <input type="number" class="form-input" id="new-inv-threshold" value="5" min="0" onfocus="this.select()">
                </div>
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn-secondary" id="add-inv-cancel">Cancel</button>
                <button type="submit" class="btn-primary">Register Asset</button>
              </div>
            </form>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table" id="owner-inventory-table">
              <!-- Loaded JS -->
            </table>
          </div>
        </div>
      `;

      // Form display toggling
      const addFormPanel = contentArea.querySelector('#add-inv-form-panel');
      const addBtn = contentArea.querySelector('#owner-add-inv-btn');
      const cancelBtn = contentArea.querySelector('#add-inv-cancel');
      const newInvForm = contentArea.querySelector('#new-inventory-form');
      const typeSelect = contentArea.querySelector('#new-inv-type');
      const thresholdInput = contentArea.querySelector('#new-inv-threshold');

      addBtn.addEventListener('click', () => {
        addFormPanel.style.display = 'block';
        addBtn.style.display = 'none';
      });

      cancelBtn.addEventListener('click', () => {
        addFormPanel.style.display = 'none';
        addBtn.style.display = 'block';
      });

      // No longer hide the threshold field by type - all inventory can have a threshold now.

      const renderInvTable = () => {
        const table = contentArea.querySelector('#owner-inventory-table');
        const items = db.getInventory();

        table.innerHTML = `
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Stock / Qty</th>
              <th>Status</th>
              <th>Details / Threshold</th>
              <th>Action Ledger</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              let badgeStatus = 'status-functional';
              if (item.status === 'Broken') badgeStatus = 'status-broken';
              else if (item.status === 'Under Maintenance') badgeStatus = 'status-maintenance';

              const isLow = item.threshold != null && item.quantity <= item.threshold;

              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-primary);">${item.name}</td>
                  <td style="text-transform: capitalize;">${item.type}</td>
                  <td>
                    <span style="font-weight: 600; ${isLow ? 'color: var(--accent-orange);' : ''}">${item.quantity}</span>
                    ${isLow ? `<span style="font-size: 9px; padding: 2px 5px; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); border-radius: 4px; margin-left: 6px; color: var(--accent-orange); font-weight:700;">LOW</span>` : ''}
                  </td>
                  <td><span class="status-badge ${badgeStatus}">${item.status}</span></td>
                  <td style="font-size: 12px; color: var(--text-muted);">
                    <span id="serviced-${item.id}" style="${item.type === 'equipment' ? '' : 'display:none;'}">Serviced: ${item.lastServiced || 'N/A'}</span>
                    <span class="inline-threshold-display" data-id="${item.id}">Min Threshold: ${item.threshold ?? '-'}</span>
                    <span class="inline-threshold-edit" data-id="${item.id}" style="display:none;">
                      <input type="number" class="form-input inline-threshold-input" value="${item.threshold ?? 0}" style="width:80px; padding:4px 8px; font-size:12px;" data-id="${item.id}">
                    </span>
                    <button class="btn-secondary threshold-edit-btn" style="padding: 2px 8px; font-size:11px; margin-left:6px;" data-id="${item.id}">Set</button>
                    <button class="btn-primary threshold-save-btn" style="padding: 2px 8px; font-size:11px; margin-left:4px; display:none;" data-id="${item.id}">Save</button>
                  </td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-secondary toggle-status-btn" style="padding: 4px 8px; font-size:11px;" data-id="${item.id}">Toggle Status</button>
                      <button class="btn-secondary qty-inc-btn" style="padding: 4px 8px; font-size:11px;" data-id="${item.id}">+</button>
                      <button class="btn-secondary qty-dec-btn" style="padding: 4px 8px; font-size:11px;" data-id="${item.id}">-</button>
                      <button class="btn-secondary delete-inv-btn" style="padding: 4px 8px; font-size:11px; border-color: rgba(239, 68, 68, 0.3); color: #ef4444;" data-id="${item.id}">${ICONS.trash}</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        `;

        // Inline threshold editing for subliments
        table.querySelectorAll('.threshold-edit-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const itemId = btn.getAttribute('data-id');
            const row = table.querySelector(`.inline-threshold-display[data-id="${itemId}"]`);
            const editWrap = table.querySelector(`.inline-threshold-edit[data-id="${itemId}"]`);
            const saveBtn = table.querySelector(`.threshold-save-btn[data-id="${itemId}"]`);
            if (!row || !editWrap) return;
            row.style.display = 'none';
            btn.style.display = 'none';
            editWrap.style.display = 'inline';
            saveBtn.style.display = 'inline';
            const input = editWrap.querySelector('.inline-threshold-input');
            if (input) input.focus();
          });
        });

        table.querySelectorAll('.threshold-save-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const itemId = btn.getAttribute('data-id');
            const input = table.querySelector(`.inline-threshold-input[data-id="${itemId}"]`);
            const row = table.querySelector(`.inline-threshold-display[data-id="${itemId}"]`);
            const editWrap = table.querySelector(`.inline-threshold-edit[data-id="${itemId}"]`);
            const setBtn = table.querySelector(`.threshold-edit-btn[data-id="${itemId}"]`);
            const item = items.find(i => i.id === itemId);
            if (!item || !input) return;

            const newVal = parseInt(input.value, 10);
            if (Number.isNaN(newVal) || newVal < 0) {
              alert('Threshold must be a non-negative number.');
              return;
            }

            item.threshold = newVal;
            await db.saveInventory(item);
            renderInvTable();
            renderAlerts();
            const updatedStats = calculateDashboardData();
            div.querySelector('.analytics-grid').children[3].querySelector('.value').textContent = `${updatedStats.lowStockCount} Items`;
          });
        });

        // Bind Table Action buttons
        table.querySelectorAll('.toggle-status-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const itemId = btn.getAttribute('data-id');
            const item = items.find(i => i.id === itemId);
            if (item) {
              const statusCycle = ['Functional', 'Broken', 'Under Maintenance'];
              const currentIdx = statusCycle.indexOf(item.status);
              item.status = statusCycle[(currentIdx + 1) % statusCycle.length];
              await db.saveInventory(item);
              renderInvTable();
              renderAlerts();
            }
          });
        });

        table.querySelectorAll('.qty-inc-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const itemId = btn.getAttribute('data-id');
            const item = items.find(i => i.id === itemId);
            if (item) {
              item.quantity++;
              await db.saveInventory(item);
              renderInvTable();
              renderAlerts();
              // Update dashboard stock alert count indicator
              const updatedStats = calculateDashboardData();
              div.querySelector('.analytics-grid').children[3].querySelector('.value').textContent = `${updatedStats.lowStockCount} Items`;
            }
          });
        });

        table.querySelectorAll('.qty-dec-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const itemId = btn.getAttribute('data-id');
            const item = items.find(i => i.id === itemId);
            if (item && item.quantity > 0) {
              item.quantity--;
              await db.saveInventory(item);
              renderInvTable();
              renderAlerts();
              // Update dashboard stock alert count indicator
              const updatedStats = calculateDashboardData();
              div.querySelector('.analytics-grid').children[3].querySelector('.value').textContent = `${updatedStats.lowStockCount} Items`;
            }
          });
        });

        table.querySelectorAll('.delete-inv-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const itemId = btn.getAttribute('data-id');
            const item = items.find(i => i.id === itemId);
            const bypass = localStorage.getItem('gms_bypass_confirm') === 'true';
            
            const performDelete = async () => {
              await db.deleteInventory(itemId);
              renderInvTable();
              renderAlerts();
              // Update dashboard stock alert count indicator
              const updatedStats = calculateDashboardData();
              div.querySelector('.analytics-grid').children[3].querySelector('.value').textContent = `${updatedStats.lowStockCount} Items`;
            };

            if (item) {
              if (bypass) {
                performDelete();
              } else {
                showConfirmModal(
                  'Confirm Asset Deletion',
                  `Are you sure you want to delete the asset "${item.name}" from the gym ledger? This action cannot be undone.`,
                  performDelete
                );
              }
            }
          });
        });
      };

      // Form submit registry
      newInvForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = contentArea.querySelector('#new-inv-name').value;
        const type = contentArea.querySelector('#new-inv-type').value;
        const quantity = parseInt(contentArea.querySelector('#new-inv-qty').value);
        const status = contentArea.querySelector('#new-inv-status').value;
        const threshold = parseInt(contentArea.querySelector('#new-inv-threshold').value) || 0;

        const newItem = {
          name,
          type,
          quantity,
          status,
          lastServiced: type === 'equipment' ? new Date().toISOString().split('T')[0] : undefined,
          threshold
        };

        await db.saveInventory(newItem);
        newInvForm.reset();
        addFormPanel.style.display = 'none';
        addBtn.style.display = 'block';

        renderInvTable();
        renderAlerts();
        // Update stats
        const updatedStats = calculateDashboardData();
        div.querySelector('.analytics-grid').children[3].querySelector('.value').textContent = `${updatedStats.lowStockCount} Items`;
      });

      renderInvTable();
    } else if (tabId === 'customers') {
      contentArea.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="margin-bottom: 15px;">Customer Directory</h3>
          <div class="plan-editor">
            <div class="glass-panel" style="padding: 16px; height: fit-content;">
              <div id="owner-customer-list"></div>
            </div>
            <div class="glass-panel" style="padding: 24px;" id="owner-customer-detail"></div>
          </div>
        </div>
      `;

      const customers = db.getUsers().filter(u => u.role === 'Customer');
      const listContainer = contentArea.querySelector('#owner-customer-list');
      const detailContainer = contentArea.querySelector('#owner-customer-detail');
      let selectedCustomerId = customers[0]?.id || '';

      const renderCustomerList = () => {
        listContainer.innerHTML = customers.map(c => `
          <div class="client-item glass-panel ${c.id === selectedCustomerId ? 'active' : ''}" data-id="${c.id}" style="cursor:pointer; margin-bottom:8px;">
            <div style="font-weight:600; color: var(--text-primary);">${c.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${c.email}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Member: ${c.membership || 'Basic'}</div>
          </div>
        `).join('');

        listContainer.querySelectorAll('.client-item').forEach(item => {
          item.addEventListener('click', () => {
            selectedCustomerId = item.getAttribute('data-id');
            renderCustomerList();
            renderCustomerDetail();
          });
        });
      };

      const renderCustomerDetail = () => {
        const customer = customers.find(c => c.id === selectedCustomerId);
        if (!customer) {
          detailContainer.innerHTML = `<p style="color: var(--text-secondary);">Select a customer to view details.</p>`;
          return;
        }

        const attendance = db.getAttendance().filter(a => a.userId === customer.id).sort((a,b) => b.date.localeCompare(a.date));
        const plan = db.getFitnessPlans().find(p => p.customerId === customer.id);
        const totalHours = attendance.reduce((acc, curr) => acc + (curr.duration || 0), 0).toFixed(1);
        const totalCheckins = attendance.length;

        detailContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0 0 8px;">${customer.name}</h2>
              <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${customer.email}</p>
            </div>
            <span class="role-badge badge-customer" style="font-size: 12px;">${customer.role || 'Customer'}</span>
          </div>

          <div class="analytics-grid" style="margin-bottom: 24px;">
            <div class="analytics-card glass-panel">
              <div class="label">Membership</div>
              <div class="value" style="color: var(--accent-green);">${customer.membership || 'Basic'}</div>
              <div class="meta">Joined: ${customer.joinedDate || '-'}</div>
            </div>
            <div class="analytics-card glass-panel">
              <div class="label">Total Check-ins</div>
              <div class="value">${totalCheckins} Times</div>
              <div class="meta">All-time logs</div>
            </div>
            <div class="analytics-card glass-panel">
              <div class="label">Total Hours</div>
              <div class="value">${totalHours} Hrs</div>
              <div class="meta">Average ~1.5h per session</div>
            </div>
          </div>

          <h3 style="margin-bottom: 12px;">Check-In History</h3>
          ${attendance.length === 0 ? `
            <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-secondary);">
              No attendance history recorded yet.
            </div>
          ` : `
            <div class="data-table-wrapper" style="margin-bottom: 24px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  ${attendance.map(log => `
                    <tr>
                      <td>${log.date}</td>
                      <td>${log.checkIn}</td>
                      <td>${log.checkOut || '<span style="color: var(--accent-green);">Active</span>'}</td>
                      <td>${log.duration ? log.duration + ' hrs' : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <h3 style="margin-bottom: 12px;">Fitness Plan</h3>
          ${!plan ? `
            <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-secondary);">
              No active training plan assigned to this customer yet.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div class="glass-panel" style="padding: 16px;">
                <h4 style="margin: 0 0 10px; color: var(--accent-green);">Workout Schedule</h4>
                <div class="workout-days-grid">
                  ${plan.workoutPlan.map(w => `
                    <div class="day-card glass-panel" style="background: rgba(255,255,255,0.01);">
                      <h4>${w.day}</h4>
                      <span class="focus">${w.focus}</span>
                      <p>${w.exercises}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="glass-panel" style="padding: 16px;">
                <h4 style="margin: 0 0 10px; color: var(--accent-blue);">Nutrition Log</h4>
                <div class="data-table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Meal Target</th>
                        <th>Diet Plan Recipe & Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${plan.nutritionPlan.map(n => `
                        <tr>
                          <td style="font-weight: 600; color: var(--text-primary);">${n.meal}</td>
                          <td>${n.detail}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          `}
        `;
      };

      renderCustomerList();
      renderCustomerDetail();
    } else if (tabId === 'trainers') {
      contentArea.innerHTML = `
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="margin-bottom: 15px;">Personal Trainers Directory</h3>
          <div class="plan-editor">
            <div class="glass-panel" style="padding: 16px; height: fit-content;">
              <div id="owner-trainer-list"></div>
            </div>
            <div class="glass-panel" style="padding: 24px;" id="owner-trainer-detail"></div>
          </div>
        </div>
      `;

      const trainers = db.getUsers().filter(u => u.role === 'Trainer');
      const listContainer = contentArea.querySelector('#owner-trainer-list');
      const detailContainer = contentArea.querySelector('#owner-trainer-detail');
      let selectedTrainerId = trainers[0]?.id || '';

      const renderTrainerList = () => {
        listContainer.innerHTML = trainers.map(t => `
          <div class="client-item glass-panel ${t.id === selectedTrainerId ? 'active' : ''}" data-id="${t.id}" style="cursor:pointer; margin-bottom:8px;">
            <div style="font-weight:600; color: var(--text-primary);">${t.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${t.email}</div>
            <div style="font-size: 11px; color: var(--text-muted);">Joined: ${t.joinedDate || '-'}</div>
          </div>
        `).join('');

        listContainer.querySelectorAll('.client-item').forEach(item => {
          item.addEventListener('click', () => {
            selectedTrainerId = item.getAttribute('data-id');
            renderTrainerList();
            renderTrainerDetail();
          });
        });
      };

      const renderTrainerDetail = () => {
        const trainer = trainers.find(t => t.id === selectedTrainerId);
        if (!trainer) {
          detailContainer.innerHTML = `<p style="color: var(--text-secondary);">Select a trainer to view details.</p>`;
          return;
        }

        const directoryEntry = (db.getDirectory() || []).find(d => d.type === 'trainer' && d.linked_user_id === trainer.id);

        const allPlans = db.getFitnessPlans();
        const assignedPlans = allPlans.filter(p => p.trainerId === trainer.id);
        const distinctClients = [...new Set(assignedPlans.map(p => p.customerId))];
        const clients = db.getUsers().filter(u => distinctClients.includes(u.id));

        detailContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0 0 8px;">${directoryEntry?.name || trainer.name}</h2>
              <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">${trainer.email}</p>
            </div>
            <span class="role-badge badge-trainer" style="font-size: 12px;">${trainer.role || 'Trainer'}</span>
          </div>

          <div class="analytics-grid" style="margin-bottom: 24px;">
            <div class="analytics-card glass-panel">
              <div class="label">Specialty</div>
              <div class="value" style="font-size: 16px;">${directoryEntry?.specialty || '-'}</div>
              <div class="meta">${directoryEntry?.experience || ''}</div>
            </div>
            <div class="analytics-card glass-panel">
              <div class="label">Assigned Clients</div>
              <div class="value">${clients.length}</div>
              <div class="meta">Active regimen plans</div>
            </div>
            <div class="analytics-card glass-panel">
              <div class="label">Joined</div>
              <div class="value">${trainer.joinedDate || '-'}</div>
              <div class="meta">Account date</div>
            </div>
          </div>

          <h3 style="margin-bottom: 12px;">Bio</h3>
          <div class="glass-panel" style="padding: 16px; margin-bottom: 24px;">
            ${directoryEntry?.bio || 'No bio available.'}
          </div>

          <h3 style="margin-bottom: 12px;">Assigned Clients</h3>
          ${clients.length === 0 ? `
            <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-secondary);">
              No clients assigned yet.
            </div>
          ` : `
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Membership</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(c => `
                    <tr>
                      <td style="font-weight: 600; color: var(--text-primary);">${c.name}</td>
                      <td>${c.email}</td>
                      <td>${c.membership || 'Basic'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        `;
      };

      renderTrainerList();
      renderTrainerDetail();
    }
  };

  // Initial Load Subtab and Alerts banner
  loadOwnerTab('reception');
  renderAlerts();

  // Tab bindings
  div.querySelector('#owner-tab-reception').addEventListener('click', () => loadOwnerTab('reception'));
  div.querySelector('#owner-tab-analytics').addEventListener('click', () => loadOwnerTab('analytics'));
  div.querySelector('#owner-tab-inventory').addEventListener('click', () => loadOwnerTab('inventory'));
  div.querySelector('#owner-tab-trainers').addEventListener('click', () => loadOwnerTab('trainers'));
  div.querySelector('#owner-tab-customers').addEventListener('click', () => loadOwnerTab('customers'));

  return div;
}

// Custom Modal Overlay Prompt
export function showConfirmModal(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'custom-modal-overlay';
  modal.innerHTML = `
    <div class="custom-modal-card glass-panel">
      <div class="custom-modal-header">
        <span class="custom-modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </span>
        <h3>${title}</h3>
      </div>
      <div class="custom-modal-body">
        <p>${message}</p>
      </div>
      <div class="custom-modal-actions">
        <button class="modal-cancel-btn">Cancel</button>
        <button class="modal-confirm-btn">Confirm Delete</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Disable body scroll
  document.body.style.overflow = 'hidden';
  
  const close = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  
  modal.querySelector('.modal-cancel-btn').addEventListener('click', close);
  modal.querySelector('.modal-confirm-btn').addEventListener('click', () => {
    onConfirm();
    close();
  });
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      close();
    }
  });
}

export function showProfileModal(user) {
  const modal = document.createElement('div');
  modal.className = 'custom-modal-overlay';
  const name = user.name || '';
  const email = user.email || '';
  const gymAddress = user.gymAddress || '';
  const gpsLocation = user.gpsLocation || '';
  const mobileNumber = user.mobileNumber || '';
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=10b981&color=fff`;
  modal.innerHTML = `
    <div class="custom-modal-card glass-panel">
      <div class="custom-modal-header profile-modal-header">
        <div class="profile-modal-avatar">
          <img src="${avatarUrl}" alt="${name || 'User'}" />
        </div>
        <div>
          <h3>Your profile</h3>
          <div class="profile-subtitle" style="color: var(--text-muted); font-size: 12px;">View and edit your details</div>
        </div>
      </div>
      <div class="custom-modal-body">
        <form id="profile-form" class="profile-form" novaildate>
          <div class="profile-field">
            <label>Name</label>
            <input type="text" id="profile-name" value="${name}" />
          </div>
          <div class="profile-field">
            <label>Email</label>
            <input type="email" id="profile-email" value="${email}" />
          </div>
          <div class="profile-field">
            <label>Mobile Number</label>
            <input type="tel" id="profile-mobile" value="${mobileNumber}" />
          </div>
          <div class="profile-field">
            <label>Gym Address</label>
            <input type="text" id="profile-gym-address" value="${gymAddress}" />
          </div>
          <div class="profile-field">
            <label>GPS Location</label>
            <input type="text" id="profile-gps" value="${gpsLocation}" />
          </div>
        </form>
      </div>
      <div class="custom-modal-actions">
        <button class="modal-cancel-btn" id="profile-cancel-edit">Cancel</button>
        <button class="modal-confirm-btn" id="profile-save">Save changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  const close = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  const getUpdatedUser = () => ({
    ...user,
    name: (modal.querySelector('#profile-name')?.value || '').trim(),
    email: (modal.querySelector('#profile-email')?.value || '').trim(),
    mobileNumber: (modal.querySelector('#profile-mobile')?.value || '').trim(),
    gymAddress: (modal.querySelector('#profile-gym-address')?.value || '').trim(),
    gpsLocation: (modal.querySelector('#profile-gps')?.value || '').trim(),
  });
  modal.querySelector('.modal-cancel-btn').addEventListener('click', () => {
    close();
  });
  modal.querySelector('#profile-save').addEventListener('click', async () => {
    const updated = getUpdatedUser();
    Object.assign(user, updated);
    try {
      await db.updateProfile({
        name: updated.name,
        email: updated.email,
        phone: updated.phone || null,
        gymAddress: updated.gymAddress || null,
        gpsLocation: updated.gpsLocation || null,
        mobileNumber: updated.mobileNumber || null
      });
    } catch (e) {
      console.error('Profile update failed', e);
    }
    refreshNavbarAfterProfileUpdate(updated);
    close();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

export function showSettingsModal(user) {
  const modal = document.createElement('div');
  modal.className = 'custom-modal-overlay';
  const name = user.name || '';
  const email = user.email || '';
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=10b981&color=fff`;
  modal.innerHTML = `
    <div class="custom-modal-card glass-panel">
      <div class="custom-modal-header profile-modal-header">
        <div class="profile-modal-avatar">
          <img src="${avatarUrl}" alt="${name || 'User'}" />
        </div>
        <div>
          <h3>Settings</h3>
          <div class="profile-subtitle" style="color: var(--text-muted); font-size: 12px;">Account and app preferences</div>
        </div>
      </div>
      <div class="custom-modal-body">
        <p style="color: var(--text-secondary);">Manage your account preferences, notifications, and profile updates.</p>
        <div class="profile-row">
          <span class="profile-label">Theme</span>
          <span>System default</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Notifications</span>
          <span>Enabled</span>
        </div>
      </div>
      <div class="custom-modal-actions">
        <button class="modal-cancel-btn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  const close = () => {
    modal.remove();
    document.body.style.overflow = '';
  };
  modal.querySelector('.modal-cancel-btn').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

export function refreshNavbarAfterProfileUpdate(updatedUser) {
  const stored = window.__vigorCurrentUser;
  if (!stored) return;
  Object.assign(stored, updatedUser);
  const welcomeEl = document.querySelector('#welcome-heading');
  const profileTitleEl = document.querySelector('#profile-sidebar-name');
  if (welcomeEl && updatedUser.name) welcomeEl.textContent = 'Welcome back, ' + updatedUser.name;
  if (profileTitleEl && updatedUser.name) profileTitleEl.textContent = updatedUser.name;
}

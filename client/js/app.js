// Client Router and Controller for Gym Management System (GMS)
import * as db from './db.js';
import * as components from './components.js';

// App State
let currentRoute = 'home';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  // Set router references
  window.GMS_ROUTER = {
    navigate
  };

  // Show a lightweight loading state while we hit the API for the first time
  const appRoot = document.getElementById('app-root');
  if (appRoot) {
    appRoot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-size:14px;color:#94a3b8;">Loading VigorGMS...</div>`;
  }

  // Populate directory cache (and, if a token exists, users/inventory/
  // attendance/fitness-plan caches too) before any component tries to read
  // from them synchronously.
  await db.initDB();

  // Check if user is already logged in
  const cachedUser = db.getCurrentUser();
  if (cachedUser) {
    currentRoute = 'dashboard';
  }

  // Load initial route
  navigate(currentRoute);
});

// Navigation Router
function navigate(route, authMode = 'login') {
  currentRoute = route;
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;

  // Clear current page elements
  appRoot.innerHTML = '';

  const currentUser = db.getCurrentUser();

  // Render sticky Navbar
  const navbar = components.renderNavbar(currentUser, navigate, handleSignOut);
  appRoot.appendChild(navbar);

  // Main Page wrapper container
  const pageContent = document.createElement('div');
  pageContent.className = route === 'dashboard' || route === 'auth' ? 'dashboard-page' : 'public-page';
  appRoot.appendChild(pageContent);

  // Route Selection
  if (route === 'home') {
    // 1. Hero banner section
    pageContent.appendChild(components.renderHero(navigate));
    // 2. Core operational modules
    pageContent.appendChild(components.renderFeatures());
    // 3. Pricing tiers
    pageContent.appendChild(components.renderPricing(navigate));
    // 4. Certified Professionals directories
    pageContent.appendChild(components.renderDirectory());
    
    // Footer section
    const footer = document.createElement('footer');
    footer.className = 'footer container';
    footer.innerHTML = `<p>&copy; 2026 VigorGMS. All rights reserved. Built with modern high-fidelity technologies.</p>`;
    pageContent.appendChild(footer);
    
  } else if (route === 'auth') {
    const onAuthSuccess = (user) => {
      navigate('dashboard');
    };
    // Render the dedicated split-panel auth page
    const authEl = components.renderAuthPage(onAuthSuccess, authMode);
    pageContent.appendChild(authEl);

  } else if (route === 'dashboard') {
    if (!currentUser) {
      // Redirect unauthorized users to login page
      navigate('auth', 'login');
      return;
    }
    
    // Render the role-appropriate dashboard structure
    // (db caches for this user's role were already populated by
    // initDB()/login()/register() before we ever reach this route)
    const dashEl = components.renderDashboard(currentUser, navigate);
    pageContent.appendChild(dashEl);
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// Sign Out Handler
function handleSignOut() {
  db.clearCurrentUser();
  navigate('home');
  alert('You have logged out successfully.');
}

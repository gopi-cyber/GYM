// Client Router and Controller for Gym Management System (GMS)
import * as db from './db.js';
import * as components from './components.js';
import * as admin from './admin.js';

// App State
let currentRoute = 'home';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  window.GMS_ROUTER = { navigate };

  const appRoot = document.getElementById('app-root');
  if (appRoot) {
    appRoot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-size:14px;color:#94a3b8;">Loading VigorGMS...</div>`;
  }

  await db.initDB();

  const cachedUser = db.getCurrentUser();
  if (cachedUser) {
    currentRoute = 'dashboard';
  }

  navigate(currentRoute);
});

// Navigation Router
function navigate(route, authMode = 'login') {
  currentRoute = route;
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;

  appRoot.innerHTML = '';

  const currentUser = db.getCurrentUser();

  const navbar = components.renderNavbar(currentUser, navigate, handleSignOut);
  appRoot.appendChild(navbar);

  const pageContent = document.createElement('div');
  pageContent.className = route === 'dashboard' || route === 'auth' || route === 'admin' || route === 'checkout' ? 'dashboard-page' : 'public-page';
  appRoot.appendChild(pageContent);

  if (route === 'home') {
    pageContent.appendChild(components.renderHero(navigate));
    pageContent.appendChild(components.renderFeatures());
    pageContent.appendChild(components.renderPricing(navigate));
    pageContent.appendChild(components.renderDirectory());

    const footer = document.createElement('footer');
    footer.className = 'footer container';
    footer.innerHTML = `<p>&copy; 2026 VigorGMS. All rights reserved. Built with modern high-fidelity technologies.</p>`;
    pageContent.appendChild(footer);

  } else if (route === 'auth') {
    const onAuthSuccess = (user) => {
      navigate('dashboard');
    };
    const authEl = components.renderAuthPage(onAuthSuccess, authMode);
    pageContent.appendChild(authEl);

  } else if (route === 'dashboard') {
    if (!currentUser) {
      navigate('auth', 'login');
      return;
    }

    let dashEl;
    if (currentUser.role === 'Owner' && db.isAdminUser()) {
      dashEl = components.renderDashboard(currentUser, navigate);
    } else if (currentUser.role === 'Owner' && db.isAdminUser()) {
      dashEl = components.renderDashboard(currentUser, navigate);
    } else {
      dashEl = components.renderDashboard(currentUser, navigate);
    }
    pageContent.appendChild(dashEl);

  } else if (route === 'admin') {
    if (!currentUser || !db.isAdminUser()) {
      navigate('auth', 'login');
      return;
    }
    pageContent.appendChild(admin.renderAdminPage(navigate));

  } else if (route === 'checkout') {
    const checkoutEl = components.renderCheckoutPage(navigate);
    pageContent.appendChild(checkoutEl);
  }

  window.scrollTo(0, 0);
}

// Sign Out Handler
function handleSignOut() {
  db.clearCurrentUser();
  navigate('home');
  alert('You have logged out successfully.');
}

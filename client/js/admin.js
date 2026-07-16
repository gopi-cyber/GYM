// Admin Portal View Module for VigorGMS
import * as db from './db.js';

let currentAdminTab = 'stats';

export function renderAdminPage(navigate) {
  const wrapper = document.createElement('div');
  wrapper.className = 'admin-layout';

  const sidebar = document.createElement('aside');
  sidebar.className = 'admin-sidebar';

  const tabs = [
    { key: 'stats', label: 'Stats' },
    { key: 'companies', label: 'Companies' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'actions', label: 'Actions' },
  ];

  const tabList = document.createElement('nav');
  tabList.className = 'admin-tabs';

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'admin-tab-btn' + (tab.key === currentAdminTab ? ' active' : '');
    btn.textContent = tab.label;
    btn.onclick = () => {
      currentAdminTab = tab.key;
      const content = wrapper.querySelector('.admin-content');
      if (content) content.replaceWith(renderAdminContent(navigate));
      updateSidebar();
    };
    tabList.appendChild(btn);
  });

  sidebar.appendChild(tabList);

  const backBtn = document.createElement('button');
  backBtn.className = 'admin-back-btn';
  backBtn.textContent = '← Back to Dashboard';
  backBtn.onclick = () => navigate('dashboard');
  sidebar.appendChild(backBtn);

  wrapper.appendChild(sidebar);
  const content = renderAdminContent(navigate);
  wrapper.appendChild(content);

  function updateSidebar() {
    const btns = sidebar.querySelectorAll('.admin-tab-btn');
    btns.forEach((btn, idx) => {
      btn.classList.toggle('active', tabs[idx].key === currentAdminTab);
    });
  }

  return wrapper;
}

function renderAdminContent(navigate) {
  const content = document.createElement('div');
  content.className = 'admin-content';

  if (currentAdminTab === 'stats') {
    renderStatsTab(content);
  } else if (currentAdminTab === 'companies') {
    renderCompaniesTab(content, navigate);
  } else if (currentAdminTab === 'invoices') {
    renderInvoicesTab(content);
  } else if (currentAdminTab === 'actions') {
    renderActionsTab(content);
  }

  return content;
}

async function renderStatsTab(container) {
  container.innerHTML = `<div class="admin-loading">Loading stats...</div>`;
  try {
    const stats = await db.loadAdminStats();
    container.innerHTML = `
      <div class="admin-header"><h2>Platform Overview</h2></div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Total Companies</div><div class="stat-value">${stats.companiesCount}</div></div>
        <div class="stat-card"><div class="stat-label">Active Subscriptions</div><div class="stat-value">${stats.activeSubs}</div></div>
        <div class="stat-card"><div class="stat-label">Trialing</div><div class="stat-value">${stats.trialing}</div></div>
        <div class="stat-card"><div class="stat-label">Invoices</div><div class="stat-value">${stats.invoices}</div></div>
        <div class="stat-card"><div class="stat-label">Paid Invoices</div><div class="stat-value">${stats.paidInvoices}</div></div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="admin-error">Failed to load stats: ${e.message}</div>`;
  }
}

async function renderCompaniesTab(container, navigate) {
  container.innerHTML = `<div class="admin-loading">Loading companies...</div>`;
  try {
    const companies = await db.loadAdminCompanies();
    const rows = companies.map(c => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.slug)}</td>
        <td><span class="status-badge status-${c.status}">${escapeHtml(c.status)}</span></td>
        <td>${escapeHtml(c.plan_slug || '-')}</td>
        <td>${c.subscription_status ? escapeHtml(c.subscription_status) : '-'}</td>
        <td>${c.current_period_end || '-'}</td>
        <td>${c.trial_end || '-'}</td>
        <td>
          <button class="btn-sm btn-activate" data-id="${c.id}" data-status="active">Activate</button>
          <button class="btn-sm btn-suspend" data-id="${c.id}" data-status="suspended">Suspend</button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="admin-header"><h2>Companies</h2></div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Plan</th><th>Subscription</th><th>Period End</th><th>Trial End</th><th>Actions</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="8">No companies</td></tr>'}</tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('button[data-id]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        try {
          await apiFetch(`/admin/companies/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
          });
          renderCompaniesTab(container, navigate);
        } catch (e) {
          alert(e.message);
        }
      };
    });
  } catch (e) {
    container.innerHTML = `<div class="admin-error">Failed to load companies: ${e.message}</div>`;
  }
}

async function fetchPageClients(path, options = {}) {
  const token = db.getToken ? db.getToken() : null;
  if (!token) throw new Error('Not authenticated');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${location.protocol}//${location.host}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return Array.isArray(data) ? data : [];
}

function renderInvoicesTab(container) {
  const pageSize = 10;
  let page = 0;
  let invoices = [];
  let loading = false;
  let error = null;

  container.innerHTML = `
    <div class="admin-header"><h2>Invoices</h2></div>
    <div id="admin-invoicing-state" class="admin-loading">Loading invoices...</div>
    <div id="invoice-pager" class="pager"></div>
  `;

  const stateEl = container.querySelector('#admin-invoicing-state');
  const pagerEl = container.querySelector('#invoice-pager');

  async function load(pageNum) {
    if (loading) return;
    loading = true;
    error = null;
    if (stateEl) stateEl.className = 'admin-loading';
    if (stateEl) stateEl.textContent = 'Loading invoices...';
    page = pageNum || 0;
    try {
      const start = page * pageSize;
      const rowsPromise = fetchPageClients(`/api/admin/invoices?limit=${pageSize}&offset=${start}`);
      const countPromise = fetchPageClients(`/api/admin/invoices/count`).then(arr => Array.isArray(arr) && arr[0] && typeof arr[0].count === 'number' ? arr[0].count : arr.length);
      invoices = await rowsPromise;
      const total = await countPromise;

      renderTable(stateEl, pagerEl, invoices, total);
    } catch (e) {
      error = e;
      if (stateEl) {
        stateEl.className = 'admin-error';
        stateEl.textContent = `Failed to load invoices: ${e.message}`;
      }
      if (pagerEl) pagerEl.innerHTML = '';
    } finally {
      loading = false;
    }
  }

  function renderTable(stateEl, pagerEl, invoices, total) {
    if (!Array.isArray(invoices) || !invoices.length) {
      if (stateEl) { stateEl.className = 'admin-error'; stateEl.textContent = 'No invoices yet.'; }
      if (pagerEl) pagerEl.innerHTML = '';
      return;
    }

    const rows = invoices.map(inv => `
      <tr>
        <td>${escapeHtml(inv.id)}</td>
        <td>${escapeHtml(inv.company_slug || '-')}</td>
        <td>${escapeHtml(inv.plan_name || inv.plan_slug || '-')}</td>
        <td>${((inv.amount_cents || 0) / 100).toFixed(2)}</td>
        <td><span class="status-badge status-${escapeHtml(inv.status || 'unknown')}">${escapeHtml(inv.status || 'unknown')}</span></td>
        <td>${escapeHtml(inv.due_date || '-')}</td>
        <td>${escapeHtml(inv.paid_at || '-')}</td>
        <td>
          ${inv.status !== 'paid' ? `<button class="btn-sm btn-pay" data-id="${escapeHtml(inv.id)}">Mark Paid</button>` : ''}
        </td>
      </tr>
    `).join('');

    tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    tableWrap.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Company</th><th>Plan</th><th>Amount</th><th>Status</th><th>Due</th><th>Paid At</th><th>Actions</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8">No invoices</td></tr>'}</tbody>
      </table>
    `;
    if (stateEl) { stateEl.className = ''; stateEl.innerHTML = ''; stateEl.appendChild(tableWrap); }

    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
    const pageNum = Math.min(page + 1, totalPages);
    if (pagerEl) {
      pagerEl.innerHTML = `
        <button class="btn-sm" id="invoice-prev" ${page <= 0 ? 'disabled' : ''}>Prev</button>
        <span>${pageNum} / ${totalPages}</span>
        <button class="btn-sm" id="invoice-next" ${page + 1 >= totalPages ? 'disabled' : ''}>Next</button>
      `;

      const prevBtn = pagerEl.querySelector('#invoice-prev');
      const nextBtn = pagerEl.querySelector('#invoice-next');
      if (prevBtn) prevBtn.onclick = () => load(page - 1);
      if (nextBtn) nextBtn.onclick = () => load(page + 1);
    }

    tableWrap.querySelectorAll('button[data-id]').forEach(btn => {
      btn.onclick = async () => {
        try {
          await db.payInvoice(btn.dataset.id);
          load(page);
        } catch (e) {
          alert(e.message);
        }
      };
    });
  }

  load(0);
}

async function renderActionsTab(container) {
  container.innerHTML = `<div class="admin-loading">Loading actions...</div>`;
  try {
    const actions = await db.loadAdminActions();
    const rows = (actions || []).map(a => `
      <tr>
        <td>${escapeHtml(a.actor_name || '')}</td>
        <td>${escapeHtml(a.action_type)}</td>
        <td>${escapeHtml(a.target_type || '')} ${escapeHtml(a.target_id || '')}</td>
        <td>${escapeHtml((a.metadata && typeof a.metadata === 'string') ? a.metadata : JSON.stringify(a.metadata || {}))}</td>
        <td>${a.created_at ? escapeHtml(a.created_at) : ''}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="admin-header"><h2>Admin Actions</h2></div>
      <div class="table-wrap">
        <table class="admin-table">
          <thead><tr><th>Actor</th><th>Action</th><th>Target</th><th>Metadata</th><th>At</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">No actions</td></tr>'}</tbody>
        </table>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="admin-error">Failed to load actions: ${e.message}</div>`;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function apiFetch(path, options = {}) {
  const token = db.getToken ? db.getToken() : null;
  if (!token) throw new Error('Not authenticated');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${location.protocol}//${location.host}${path}`, { ...options, headers });
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = null; }
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

function getAuthHeader() {
  const token = db.getToken ? db.getToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

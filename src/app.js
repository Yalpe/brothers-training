import { renderToday } from './views/today.js';
import { renderBrowse } from './views/browse.js';
import { renderTests } from './views/tests.js';
import { renderReference } from './views/reference.js';

export let data = null;
const view = document.getElementById('view');
const nav = document.getElementById('nav');

// ── localStorage helpers ──────────────────────────────────────────────────────
export function getState(key, fallback = null) {
  try {
    const v = localStorage.getItem('bht_' + key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}

export function setState(key, value) {
  try { localStorage.setItem('bht_' + key, JSON.stringify(value)); } catch {}
}

// ── Navigation ────────────────────────────────────────────────────────────────
let currentTab = 'today';

export function navigate(tab) {
  currentTab = tab;
  nav.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  renderTab(tab);
}

function renderTab(tab) {
  switch (tab) {
    case 'today':     renderToday(view, data); break;
    case 'browse':    renderBrowse(view, data); break;
    case 'tests':     renderTests(view, data); break;
    case 'reference': renderReference(view, data); break;
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
nav.addEventListener('click', e => {
  const btn = e.target.closest('[data-tab]');
  if (btn) navigate(btn.dataset.tab);
});

fetch('program-data.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    renderTab(currentTab);
  })
  .catch(() => {
    view.innerHTML = `<div class="card" style="margin-top:40px;text-align:center">
      <p style="color:#ff5252;font-weight:600">⚠️ Could not load program data.</p>
      <p class="text-dim mt-8" style="font-size:0.85rem">Make sure you're running this via a local server, not opening the file directly.</p>
    </div>`;
  });

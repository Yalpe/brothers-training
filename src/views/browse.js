import { renderSession } from './today.js';

export function renderBrowse(container, data) {
  const phases = {};
  data.weeks.forEach((w, i) => {
    if (!phases[w.phase]) phases[w.phase] = [];
    phases[w.phase].push({ w, i });
  });

  let html = `<div class="page-header">
    <div class="page-title">📋 All Sessions</div>
    <div class="page-subtitle">Tap to preview any session</div>
  </div>`;

  for (const [phase, sessions] of Object.entries(phases)) {
    html += `<div class="phase-group"><div class="phase-heading">${phase}</div>`;
    for (const { w, i } of sessions) {
      const locBadge = w.loc === 'field'
        ? '<span class="badge badge-field">⛳ Field</span>'
        : '<span class="badge badge-basement">🏠 Basement</span>';
      html += `<div class="browse-session-card" data-week="${i}">
        <div class="browse-session-left">
          <div class="exercise-name">${w.name}</div>
          <div class="session-pick-meta">${locBadge}<span class="badge badge-phase">${w.focus}</span></div>
          <div class="session-pick-dur">${w.duration}</div>
        </div>
        <div class="session-pick-arrow">›</div>
      </div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('[data-week]').forEach(card => {
    card.addEventListener('click', () => {
      const i = +card.dataset.week;
      renderSession(container, data.weeks[i], i, data, false, true);
    });
  });
}

import { getState, setState, navigate } from '../app.js';

const GAME_ICONS = {
  'ball-football': '🏈', 'target': '🎯', 'cards': '🃏', 'copy': '🪞',
  'clock-bolt': '⚡', 'paw': '🐾', 'traffic-lights': '🚦', 'run': '🏃'
};

// ── Session picker ────────────────────────────────────────────────────────────
function renderPicker(container, data, onPick) {
  const phases = {};
  data.weeks.forEach((w, i) => {
    if (!phases[w.phase]) phases[w.phase] = [];
    phases[w.phase].push({ w, i });
  });

  const current = getState('session');

  let html = `<div class="page-header">
    <div class="page-title">🏒 Choisir la séance du jour</div>
    <div class="page-subtitle">Appuyez sur une séance pour commencer</div>
  </div>`;

  for (const [phase, sessions] of Object.entries(phases)) {
    html += `<div class="phase-group">
      <div class="phase-heading">${phase}</div>`;
    for (const { w, i } of sessions) {
      const isActive = current?.weekIndex === i;
      const locBadge = w.loc === 'field'
        ? '<span class="badge badge-field">⛳ Terrain</span>'
        : '<span class="badge badge-basement">🏠 Sous-sol</span>';
      html += `<div class="session-pick-card ${isActive ? 'active-session' : ''}" data-week="${i}">
        <div>
          <div class="session-pick-name">${w.name}</div>
          <div class="session-pick-meta">
            ${locBadge}
            <span class="badge badge-phase">${w.focus}</span>
          </div>
          <div class="session-pick-dur">${w.duration}</div>
        </div>
        <div class="session-pick-arrow">${isActive ? '✓' : '›'}</div>
      </div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
  container.querySelectorAll('[data-week]').forEach(card => {
    card.addEventListener('click', () => onPick(+card.dataset.week));
  });
}

// ── Form cues panel ───────────────────────────────────────────────────────────
function cuesHTML(name, formData) {
  const fd = formData[name];
  if (!fd) return '';
  let html = '<div class="exercise-cues">';
  if (fd.cues?.length) {
    html += fd.cues.map(([text, sub]) =>
      `<div class="cue-item"><div class="cue-text">• ${text}</div>${sub ? `<div class="cue-sub">${sub}</div>` : ''}</div>`
    ).join('');
  }
  if (fd.warn) html += `<div class="cue-warn">⚠️ ${fd.warn}</div>`;
  if (fd.hockey) html += `<div class="cue-hockey">🏒 ${fd.hockey}</div>`;
  const parts = name.split(' + ');
  html += parts.map(p => {
    const q = encodeURIComponent(p.trim() + ' exercise form how to');
    return `<a class="search-link" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">🔍 Voir des vidéos — ${p.trim()}</a>`;
  }).join('');
  html += '</div>';
  return html;
}

// ── Single exercise row ───────────────────────────────────────────────────────
function exerciseRowHTML(ex, weekIndex, formData, withCheckbox = true) {
  const checkKey = `done_${weekIndex}_${ex.name}`;
  const done = getState(checkKey, false);
  const specs = ex.spec ? ex.spec.split(' / ') : [];
  const specDisplay = specs.length > 1
    ? `<span class="badge-g" style="font-size:0.75rem;padding:1px 6px;border-radius:4px">G</span> ${specs[0]}&nbsp;&nbsp;<span class="badge-s" style="font-size:0.75rem;padding:1px 6px;border-radius:4px">S</span> ${specs[1]}`
    : (ex.spec || '');

  return `<div class="exercise-row" data-ex-name="${encodeURIComponent(ex.name)}">
    <div class="exercise-top">
      ${withCheckbox ? `<button class="exercise-check ${done ? 'checked' : ''}" data-check-key="${checkKey}" aria-label="Marquer fait">${done ? '✓' : ''}</button>` : ''}
      <div class="exercise-info">
        <div class="exercise-name ${done ? 'done' : ''}">${ex.letter ? `<span style="color:var(--ice);font-weight:700">${ex.letter}.</span> ` : ''}${ex.name}</div>
        ${ex.spec ? `<div class="exercise-spec">${specDisplay}</div>` : ''}
        ${ex.detail ? `<div class="exercise-why">${ex.detail}</div>` : ''}
        ${ex.why ? `<div class="exercise-why" style="color:var(--text-dim);font-style:italic">${ex.why}</div>` : ''}
      </div>
      ${formData[ex.name] ? `<button class="exercise-expand-btn" data-expand="${encodeURIComponent(ex.name)}" aria-label="Conseils de forme">ℹ️</button>` : ''}
    </div>
    <div class="ex-cues-panel" style="display:none" data-cues-for="${encodeURIComponent(ex.name)}">
      ${cuesHTML(ex.name, formData)}
    </div>
  </div>`;
}

// ── Rest timer ────────────────────────────────────────────────────────────────
let activeTimer = null;

function parseRestSeconds(restStr) {
  const m = restStr.match(/(\d+)\s*sec/i);
  if (m) return parseInt(m[1]);
  const m2 = restStr.match(/(\d+)\s*min/i);
  if (m2) return parseInt(m2[1]) * 60;
  return 60;
}

function attachTimers(container) {
  container.querySelectorAll('[data-timer]').forEach(row => {
    const secs = +row.dataset.timer;
    const display = row.querySelector('.timer-display');
    const btn = row.querySelector('.timer-btn');
    let remaining = secs;
    let interval = null;

    function format(s) {
      return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    }

    function stop() {
      clearInterval(interval);
      interval = null;
      btn.textContent = 'Démarrer';
      display.classList.remove('timer-running');
      remaining = secs;
      display.textContent = format(secs);
    }

    function beep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.15, 0.3].forEach(t => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.3, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.15);
        });
      } catch {}
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    display.textContent = format(secs);

    btn.addEventListener('click', () => {
      if (interval) { stop(); return; }
      if (activeTimer && activeTimer !== stop) activeTimer();
      activeTimer = stop;
      btn.textContent = 'Arrêter';
      display.classList.add('timer-running');
      interval = setInterval(() => {
        remaining--;
        display.textContent = format(remaining);
        if (remaining <= 0) { stop(); beep(); }
      }, 1000);
    });
  });
}

// ── Split block ───────────────────────────────────────────────────────────────
function splitHTML(split, weekIndex, formData, withCheckbox) {
  const gKey = `done_${weekIndex}_${split.g.name}`;
  const sKey = `done_${weekIndex}_${split.s.name}`;
  const gDone = getState(gKey, false);
  const sDone = getState(sKey, false);
  const gEnc = encodeURIComponent(split.g.name);
  const sEnc = encodeURIComponent(split.s.name);

  // Cues panels render full-width below the grid, toggled by athlete selector
  const hasCuesG = !!formData[split.g.name];
  const hasCuesS = !!formData[split.s.name];

  return `<div class="split-block-wrap" data-split>
    <div class="split-row">
      <div class="split-card" data-ex-name="${gEnc}">
        <div class="split-card-header">
          ${withCheckbox ? `<button class="exercise-check ${gDone ? 'checked' : ''}" data-check-key="${gKey}" style="width:24px;height:24px;min-width:24px">${gDone ? '✓' : ''}</button>` : ''}
          <span class="badge badge-g">G</span>
          ${hasCuesG ? `<button class="exercise-expand-btn split-expand-btn" data-split-expand="g" style="margin-left:auto;font-size:0.9rem">ℹ️</button>` : ''}
        </div>
        <div class="split-name ${gDone ? 'done' : ''}">${split.g.name}</div>
        ${split.g.spec ? `<div class="split-spec">${split.g.spec}</div>` : ''}
        ${split.g.detail ? `<div class="split-detail">${split.g.detail}</div>` : ''}
      </div>
      <div class="split-card" data-ex-name="${sEnc}">
        <div class="split-card-header">
          ${withCheckbox ? `<button class="exercise-check ${sDone ? 'checked' : ''}" data-check-key="${sKey}" style="width:24px;height:24px;min-width:24px">${sDone ? '✓' : ''}</button>` : ''}
          <span class="badge badge-s">S</span>
          ${hasCuesS ? `<button class="exercise-expand-btn split-expand-btn" data-split-expand="s" style="margin-left:auto;font-size:0.9rem">ℹ️</button>` : ''}
        </div>
        <div class="split-name ${sDone ? 'done' : ''}">${split.s.name}</div>
        ${split.s.spec ? `<div class="split-spec" style="color:var(--s-color)">${split.s.spec}</div>` : ''}
        ${split.s.detail ? `<div class="split-detail">${split.s.detail}</div>` : ''}
      </div>
    </div>
    <div class="split-cues-panel" data-split-cues="g" style="display:none">
      ${hasCuesG ? cuesHTML(split.g.name, formData) : ''}
    </div>
    <div class="split-cues-panel" data-split-cues="s" style="display:none">
      ${hasCuesS ? cuesHTML(split.s.name, formData) : ''}
    </div>
  </div>`;
}

// ── Game picker block ─────────────────────────────────────────────────────────
function gamePicker(games) {
  const pick = games[Math.floor(Math.random() * games.length)];
  const icon = GAME_ICONS[pick.icon] || '🎮';
  return `<div class="game-card">
    <h3>🎮 Jeu final</h3>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:2rem">${icon}</span>
      <div>
        <div class="game-picked-name">${pick.name}</div>
        <div class="game-picked-desc">${pick.desc}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-gold btn-sm" id="game-reroll">🎲 Autre jeu</button>
      <button class="btn btn-ghost btn-sm" id="game-show-all">Voir tous les jeux</button>
    </div>
    <div id="game-list-panel" style="display:none" class="game-list">
      ${games.map(g => `
        <div class="game-list-item">
          <span class="game-icon">${GAME_ICONS[g.icon] || '🎮'}</span>
          <div>
            <div class="game-list-name">${g.name}</div>
            <div class="game-list-desc">${g.desc}</div>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}

// ── Render one session ────────────────────────────────────────────────────────
function renderSession(container, week, weekIndex, data, withCheckbox = true, showBack = false) {
  const locBadge = week.loc === 'field'
    ? '<span class="badge badge-field">⛳ Terrain</span>'
    : '<span class="badge badge-basement">🏠 Sous-sol</span>';

  let html = '';
  if (showBack) {
    html += `<button class="browse-back-btn" id="back-to-browse">← Retour aux séances</button>`;
  } else {
    html += `<div class="session-header">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
        <h1 style="font-size:1.15rem">${week.name}</h1>
        <button class="btn btn-ghost btn-sm" id="change-session">Changer</button>
      </div>
      <div class="session-meta">${locBadge}<span class="badge badge-phase">${week.phase}</span><span class="text-dim" style="font-size:0.82rem;align-self:center">${week.duration}</span></div>
      ${week.focus ? `<div class="session-focus">${week.focus}</div>` : ''}
      ${week.tip ? `<div class="session-tip">💡 ${week.tip}</div>` : ''}
    </div>`;
  }

  for (const block of week.blocks) {
    html += `<div class="block-section"><div class="block-label">${block.label}</div>`;
    for (const item of block.items) {
      if (item.game) {
        html += gamePicker(data.games);
      } else if (item.solo) {
        html += `<div class="card">`;
        html += item.exercises.map(ex => exerciseRowHTML(ex, weekIndex, data.formData, withCheckbox)).join('');
        html += `</div>`;
      } else if (item.ss) {
        const timerSecs = parseRestSeconds(item.rest || '60 sec');
        html += `<div class="superset-block">
          <div class="superset-header">
            <span class="superset-label">⚡ Supersérie</span>
            ${item.note ? `<span class="superset-note">${item.note}</span>` : ''}
          </div>
          <div class="superset-body">
            ${item.split ? splitHTML(item.split, weekIndex, data.formData, withCheckbox) : ''}
            ${item.exercises.map(ex => exerciseRowHTML(ex, weekIndex, data.formData, withCheckbox)).join('')}
          </div>
          <div class="timer-row" data-timer="${timerSecs}">
            <div>
              <div class="timer-label">Repos</div>
              <div style="font-size:0.75rem;color:var(--text-dim)">${item.rest}</div>
            </div>
            <div class="timer-display">-:--</div>
            <button class="timer-btn">Démarrer</button>
          </div>
        </div>`;
      }
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  // ── Checkboxes
  container.querySelectorAll('[data-check-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.checkKey;
      const checked = !getState(key, false);
      setState(key, checked);
      btn.classList.toggle('checked', checked);
      btn.textContent = checked ? '✓' : '';
      const exName = btn.closest('[data-ex-name]')?.dataset.exName;
      if (exName) {
        const nameEl = btn.closest('[data-ex-name]')?.querySelector('.exercise-name, .split-name');
        if (nameEl) nameEl.classList.toggle('done', checked);
      }
    });
  });

  // ── Expand cues (solo/superset exercises)
  container.querySelectorAll('[data-expand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.expand;
      const panel = container.querySelector(`[data-cues-for="${name}"]`);
      if (panel) {
        const open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : 'block';
        btn.textContent = open ? 'ℹ️' : '✕';
      }
    });
  });

  // ── Expand cues (split exercises — full-width panel below grid)
  container.querySelectorAll('[data-split-expand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const athlete = btn.dataset.splitExpand; // 'g' or 's'
      const wrap = btn.closest('[data-split]');
      const panel = wrap?.querySelector(`[data-split-cues="${athlete}"]`);
      const other = wrap?.querySelector(`[data-split-cues="${athlete === 'g' ? 's' : 'g'}"]`);
      const otherBtn = wrap?.querySelector(`[data-split-expand="${athlete === 'g' ? 's' : 'g'}"]`);
      if (!panel) return;
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      btn.textContent = open ? 'ℹ️' : '✕';
      // Close the other athlete's panel if open
      if (!open && other && other.style.display !== 'none') {
        other.style.display = 'none';
        if (otherBtn) otherBtn.textContent = 'ℹ️';
      }
    });
  });

  // ── Rest timers
  attachTimers(container);

  // ── Change session button
  container.querySelector('#change-session')?.addEventListener('click', () => {
    setState('session', null);
    renderToday(container.closest('#view') || container, data);
  });

  // ── Back to browse
  container.querySelector('#back-to-browse')?.addEventListener('click', () => {
    import('./browse.js').then(m => m.renderBrowse(container.closest('#view') || container, data));
  });

  // ── Game reroll
  const gameCard = container.querySelector('.game-card');
  if (gameCard) {
    gameCard.querySelector('#game-reroll')?.addEventListener('click', () => {
      const slot = gameCard.closest('.block-section');
      const newHtml = gamePicker(data.games);
      const tmp = document.createElement('div');
      tmp.innerHTML = newHtml;
      gameCard.replaceWith(tmp.firstElementChild);
      attachGameHandlers(slot, data);
    });
    gameCard.querySelector('#game-show-all')?.addEventListener('click', () => {
      const panel = gameCard.querySelector('#game-list-panel');
      if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
  }
}

function attachGameHandlers(slot, data) {
  const gameCard = slot.querySelector('.game-card');
  if (!gameCard) return;
  gameCard.querySelector('#game-reroll')?.addEventListener('click', () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = gamePicker(data.games);
    gameCard.replaceWith(tmp.firstElementChild);
    attachGameHandlers(slot, data);
  });
  gameCard.querySelector('#game-show-all')?.addEventListener('click', () => {
    const panel = gameCard.querySelector('#game-list-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export function renderToday(container, data) {
  const saved = getState('session');

  if (!saved) {
    renderPicker(container, data, (weekIndex) => {
      setState('session', { weekIndex });
      renderSession(container, data.weeks[weekIndex], weekIndex, data, true, false);
    });
    return;
  }

  renderSession(container, data.weeks[saved.weekIndex], saved.weekIndex, data, true, false);
}

export { renderSession };

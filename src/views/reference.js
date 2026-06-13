const GAME_ICONS = {
  'ball-football': '🏈', 'target': '🎯', 'cards': '🃏', 'copy': '🪞',
  'clock-bolt': '⚡', 'paw': '🐾', 'traffic-lights': '🚦', 'run': '🏃'
};

export function renderReference(container, data) {
  const rulesHtml = data.houseRules.map((rule, i) => `
    <div class="rule-card">
      <button class="rule-toggle" data-rule="${i}">
        <span class="rule-title">${rule.title}</span>
        <span class="rule-arrow" data-arrow="${i}">▾</span>
      </button>
      <div class="rule-body" data-rule-body="${i}" style="display:none">${rule.body}</div>
    </div>
  `).join('');

  const gamesHtml = data.games.map((g, i) => `
    <div class="ref-game-card">
      <button class="ref-game-toggle" data-game="${i}">
        <span class="game-icon">${GAME_ICONS[g.icon] || '🎮'}</span>
        <span class="ref-game-name">${g.name}</span>
        <span class="rule-arrow" data-game-arrow="${i}">▾</span>
      </button>
      <div class="ref-game-body" data-game-body="${i}" style="display:none">${g.desc}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">📖 Règles et jeux</div>
    </div>

    <div class="section-header" style="margin-top:0">
      <h2>Règles maison</h2>
    </div>
    ${rulesHtml}

    <div class="section-header">
      <h2>Menu des jeux</h2>
    </div>
    <p class="text-dim" style="font-size:0.85rem;margin-bottom:12px">Les frères alternent le choix. Celui qui a perdu la dernière fois choisit en premier.</p>
    ${gamesHtml}
  `;

  container.querySelectorAll('[data-rule]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.rule;
      const body = container.querySelector(`[data-rule-body="${i}"]`);
      const arrow = container.querySelector(`[data-arrow="${i}"]`);
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.textContent = open ? '▾' : '▲';
    });
  });

  container.querySelectorAll('[data-game]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = btn.dataset.game;
      const body = container.querySelector(`[data-game-body="${i}"]`);
      const arrow = container.querySelector(`[data-game-arrow="${i}"]`);
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.textContent = open ? '▾' : '▲';
    });
  });
}

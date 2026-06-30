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

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">📖 Règles maison</div>
    </div>

    <div class="section-header" style="margin-top:0">
      <h2>Règles maison</h2>
    </div>
    ${rulesHtml}
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
}

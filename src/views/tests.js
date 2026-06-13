import { getState, setState } from '../app.js';

function pct(prev, curr) {
  if (!prev || !curr) return null;
  const p = parseFloat(prev), c = parseFloat(curr);
  if (isNaN(p) || isNaN(c) || p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}

function formatPct(val, lowerIsBetter = false) {
  if (val === null) return '';
  const better = lowerIsBetter ? val < 0 : val > 0;
  const cls = better ? 'pos' : 'neg';
  const sign = val > 0 ? '+' : '';
  return `<span class="test-improve ${cls}">${sign}${val.toFixed(1)}%</span>`;
}

// Tests where a lower number is better (e.g. shuttle time)
const LOWER_IS_BETTER = new Set(['5-10-5 shuttle']);

export function renderTests(container, data) {
  const history = getState('test_history', []);
  const last = history[history.length - 1];

  const itemsHtml = data.tests.items.map(item => {
    const prevG = last?.G?.[item.name] ?? '';
    const prevS = last?.S?.[item.name] ?? '';
    const lib = LOWER_IS_BETTER.has(item.name);
    return `<div class="test-item card">
      <div class="test-header">
        <div class="test-name">${item.name}</div>
        <div class="test-how">${item.how}</div>
        <div class="test-unit">Unit: ${item.unit}</div>
      </div>
      <div class="test-inputs">
        <div class="test-input-group">
          <div class="test-input-label g">G — Goalie</div>
          <input class="test-input" type="text" inputmode="decimal"
            placeholder="${prevG || 'Enter result'}"
            data-athlete="G" data-test="${encodeURIComponent(item.name)}" />
          <div class="test-prev">
            ${prevG ? `Last: ${prevG} ${item.unit}` : 'No previous result'}
          </div>
        </div>
        <div class="test-input-group">
          <div class="test-input-label s">S — Skater</div>
          <input class="test-input" type="text" inputmode="decimal"
            placeholder="${prevS || 'Enter result'}"
            data-athlete="S" data-test="${encodeURIComponent(item.name)}" />
          <div class="test-prev">
            ${prevS ? `Last: ${prevS} ${item.unit}` : 'No previous result'}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  const histHtml = history.length > 0
    ? history.slice().reverse().map(entry => {
        const rows = data.tests.items.map(item => {
          const g = entry.G?.[item.name] ?? '—';
          const s = entry.S?.[item.name] ?? '—';
          return `<div style="margin-bottom:4px">
            <span style="color:var(--text-dim);font-size:0.75rem">${item.name}:</span>
            <span class="badge-g" style="font-size:0.72rem;padding:1px 5px;border-radius:4px">G</span> ${g}
            <span class="badge-s" style="font-size:0.72rem;padding:1px 5px;border-radius:4px;margin-left:6px">S</span> ${s}
          </div>`;
        }).join('');
        return `<div class="history-entry">
          <div class="history-date">📅 ${entry.date}</div>
          ${rows}
        </div>`;
      }).join('')
    : '<p class="text-dim" style="font-size:0.85rem;padding:8px 0">No test history yet.</p>';

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">📊 Test Day</div>
      <div class="page-subtitle">${data.tests.label}</div>
    </div>
    <div class="card" style="margin-bottom:16px;border-left:3px solid var(--gold)">
      <div style="font-size:0.85rem;color:var(--text-dim);line-height:1.5">
        🏆 <strong style="color:var(--gold)">Handicap rule:</strong> ${data.tests.rule}
      </div>
    </div>

    ${itemsHtml}

    <button class="btn btn-primary btn-full" id="save-tests" style="margin-top:8px">
      💾 Save results
    </button>
    <div id="save-feedback" style="display:none;text-align:center;padding:10px;color:var(--green);font-weight:600">
      ✓ Results saved!
    </div>

    <div class="divider" style="margin-top:20px"></div>
    <button class="history-toggle" id="toggle-history">▸ Past results (${history.length} entries)</button>
    <div id="history-panel" style="display:none;margin-top:8px">${histHtml}</div>
  `;

  container.querySelector('#save-tests').addEventListener('click', () => {
    const inputs = container.querySelectorAll('.test-input');
    const entry = { date: new Date().toLocaleDateString(), G: {}, S: {} };
    let hasData = false;
    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val) {
        const athlete = inp.dataset.athlete;
        const test = decodeURIComponent(inp.dataset.test);
        entry[athlete][test] = val;
        hasData = true;
      }
    });
    if (!hasData) return;

    const hist = getState('test_history', []);
    hist.push(entry);
    setState('test_history', hist);

    const fb = container.querySelector('#save-feedback');
    fb.style.display = 'block';
    setTimeout(() => fb.style.display = 'none', 2500);

    renderTests(container, data);
  });

  container.querySelector('#toggle-history').addEventListener('click', () => {
    const panel = container.querySelector('#history-panel');
    const btn = container.querySelector('#toggle-history');
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    btn.textContent = (open ? '▸' : '▾') + ` Past results (${history.length} entries)`;
  });
}

/* Shared shell, callouts and tiny SVG charts for the CoinKeeper wireframes. Not product code. */
(function () {
  const NAV = [
    { group: null, items: [['home', 'house', 'Home', 'home.html']] },
    {
      group: 'Money',
      items: [
        ['transactions', 'receipt-text', 'Transactions', 'transactions.html'],
        ['review', 'inbox', 'Review', 'review.html', '2'],
        ['accounts', 'landmark', 'Accounts', 'accounts.html'],
      ],
    },
    {
      group: 'Plan',
      items: [
        ['budgets', 'target', 'Budgets', 'budgets.html'],
        ['analytics', 'chart-no-axes-column', 'Analytics', 'analytics-overview.html'],
      ],
    },
  ];
  const FOOT = [
    ['import', 'upload', 'Import', '#'],
    ['settings', 'settings', 'Settings', '#'],
  ];

  function navItem([id, icon, label, href, badge], active) {
    const on = id === active ? ' nav-item--active' : '';
    const count = badge ? `<span class="nav-item__badge">${badge}</span>` : '';
    return `<a class="nav-item${on}" href="${href}"><i data-lucide="${icon}"></i>${label}${count}</a>`;
  }

  function shell() {
    const body = document.body;
    const active = body.dataset.page;
    if (!active || body.dataset.frame === 'none') return;
    const content = document.getElementById('content');
    const groups = NAV.map(
      ({ group, items }) =>
        (group ? `<div class="nav-label">${group}</div>` : '') +
        items.map(item => navItem(item, active)).join('')
    ).join('');
    const app = document.createElement('div');
    app.className = 'app';
    app.innerHTML = `
      <aside class="sidebar anchor" data-note="${body.dataset.sidebarNote || ''}" data-note-pos="${body.dataset.sidebarNotePos || '160,196'}">
        <div class="logo"><span class="logo__mark"><i data-lucide="chart-pie"></i></span>CoinKeeper</div>
        ${groups}
        <div class="sidebar__spacer"></div>
        ${FOOT.map(item => navItem(item, active)).join('')}
        <div class="user"><span class="user__avatar">JD</span>
          <div><div class="user__name">Jhon Doe</div><div class="user__mail">Personal</div></div>
          <i data-lucide="chevrons-up-down" style="margin-left:auto;color:var(--faint)"></i></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="search"><i data-lucide="search"></i>Search transactions and payees<span class="kbd">Ctrl K</span></div>
          <button class="btn btn--primary"><i data-lucide="plus"></i>New transaction</button>
        </header>
        <main class="page"></main>
      </div>`;
    app.querySelector('.page').append(...content.childNodes);
    content.replaceWith(app);
  }

  function notes() {
    document.querySelectorAll('[data-note]').forEach(element => {
      const value = element.dataset.note;
      if (!value) return;
      element.classList.add('anchor');
      const note = document.createElement('b');
      note.className = 'note';
      note.textContent = value;
      const [top, left] = (element.dataset.notePos || '-10,-10').split(',').map(Number);
      note.style.top = `${top}px`;
      if (left < 0 && element.dataset.noteRight) note.style.right = `${-left}px`;
      else note.style.left = `${left}px`;
      element.append(note);
    });
  }

  const svgNs = 'http://www.w3.org/2000/svg';

  function svg(width, height) {
    const element = document.createElementNS(svgNs, 'svg');
    element.setAttribute('viewBox', `0 0 ${width} ${height}`);
    element.setAttribute('class', 'chart');
    return element;
  }

  function add(parent, tag, attributes, text) {
    const element = document.createElementNS(svgNs, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    parent.append(element);
    return element;
  }

  /** Grouped vertical bars: { labels, series: [{ color, values }], max, height, ticks, format } */
  function bars(element, options) {
    const width = element.clientWidth || 600;
    const height = options.height || 200;
    const pad = { bottom: 22, left: 44, right: 4, top: 8 };
    const chart = svg(width, height);
    const max = options.max;
    const plotHeight = height - pad.top - pad.bottom;
    const ticks = options.ticks || [0, max / 2, max];
    ticks.forEach(tick => {
      const y = pad.top + plotHeight - (tick / max) * plotHeight;
      add(chart, 'line', { stroke: '#eef0f3', x1: pad.left, x2: width - pad.right, y1: y, y2: y });
      add(chart, 'text', { 'text-anchor': 'end', x: pad.left - 8, y: y + 4 }, options.format(tick));
    });
    const slot = (width - pad.left - pad.right) / options.labels.length;
    const groupWidth = Math.min(slot * 0.62, 56);
    const barWidth = groupWidth / options.series.length - 3;
    options.labels.forEach((label, index) => {
      const x0 = pad.left + slot * index + (slot - groupWidth) / 2;
      if (options.highlight === index) {
        add(chart, 'rect', {
          fill: '#f4f3ff',
          height: plotHeight + 8,
          rx: 6,
          width: slot - 6,
          x: pad.left + slot * index + 3,
          y: pad.top - 4,
        });
      }
      options.series.forEach((serie, serieIndex) => {
        const value = serie.values[index];
        const barHeight = (value / max) * plotHeight;
        add(chart, 'rect', {
          fill: serie.color,
          height: Math.max(barHeight, 1),
          rx: 3,
          width: barWidth,
          x: x0 + serieIndex * (barWidth + 3),
          y: pad.top + plotHeight - barHeight,
        });
      });
      const text = add(
        chart,
        'text',
        { 'text-anchor': 'middle', x: x0 + groupWidth / 2, y: height - 4 },
        label
      );
      if (options.highlight === index) text.setAttribute('style', 'fill:#101828;font-weight:600');
    });
    element.append(chart);
  }

  /** Stacked vertical bars: { labels, stacks: [{ color, values }], max, height, format } */
  function stacked(element, options) {
    const width = element.clientWidth || 600;
    const height = options.height || 220;
    const pad = { bottom: 22, left: 44, right: 4, top: 8 };
    const chart = svg(width, height);
    const plotHeight = height - pad.top - pad.bottom;
    const max = options.max;
    (options.ticks || [0, max / 2, max]).forEach(tick => {
      const y = pad.top + plotHeight - (tick / max) * plotHeight;
      add(chart, 'line', { stroke: '#eef0f3', x1: pad.left, x2: width - pad.right, y1: y, y2: y });
      add(chart, 'text', { 'text-anchor': 'end', x: pad.left - 8, y: y + 4 }, options.format(tick));
    });
    const slot = (width - pad.left - pad.right) / options.labels.length;
    const barWidth = Math.min(slot * 0.5, 40);
    options.labels.forEach((label, index) => {
      const x = pad.left + slot * index + (slot - barWidth) / 2;
      let base = pad.top + plotHeight;
      options.stacks.forEach(stack => {
        const barHeight = (stack.values[index] / max) * plotHeight;
        base -= barHeight;
        add(chart, 'rect', {
          fill: stack.color,
          height: Math.max(barHeight - 1.5, 0),
          width: barWidth,
          x,
          y: base,
        });
      });
      add(chart, 'text', { 'text-anchor': 'middle', x: x + barWidth / 2, y: height - 4 }, label);
    });
    element.append(chart);
  }

  /** Sparkline or area line: { values, color, height, area, baseline } */
  function line(element, options) {
    const width = element.clientWidth || 120;
    const height = options.height || 32;
    const chart = svg(width, height);
    const values = options.values;
    const min = options.min ?? Math.min(...values);
    const max = options.max ?? Math.max(...values);
    const span = max - min || 1;
    const points = values.map((value, index) => [
      (index / (values.length - 1)) * (width - 4) + 2,
      height - 3 - ((value - min) / span) * (height - 6),
    ]);
    const path = points
      .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
    if (options.area) {
      add(chart, 'path', {
        d: `${path} L${width - 2},${height} L2,${height} Z`,
        fill: options.color,
        opacity: 0.1,
      });
    }
    add(chart, 'path', {
      d: path,
      fill: 'none',
      stroke: options.color,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': options.stroke || 1.8,
    });
    const [lastX, lastY] = points[points.length - 1];
    if (options.dot) add(chart, 'circle', { cx: lastX, cy: lastY, fill: options.color, r: 3 });
    element.append(chart);
  }

  window.ck = { bars, line, stacked };

  document.addEventListener('DOMContentLoaded', () => {
    if (location.search.includes('clean')) document.body.classList.add('clean');
    shell();
    notes();
    if (window.lucide) window.lucide.createIcons();
    document.querySelectorAll('[data-chart]').forEach(element => {
      const factory = window.charts && window.charts[element.dataset.chart];
      if (factory) factory(element);
    });
    document.body.dataset.ready = 'true';
  });
})();

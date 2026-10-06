/* Препараты: справочник, карточка препарата, сравнение антипсихотиков. */
(function () {
  const { ICONS, esc } = PSY.ui;
  const S = PSY.store;

  const PROFILE = [
    { k: 'weight', label: 'Вес и метаболизм' },
    { k: 'sed', label: 'Седация' },
    { k: 'eps', label: 'Паркинсонизм (ЭПС)' },
    { k: 'akath', label: 'Акатизия' },
    { k: 'prl', label: 'Пролактин' },
    { k: 'qtc', label: 'Удлинение QTc' },
    { k: 'ach', label: 'Холинолитические' },
    { k: 'orth', label: 'Ортостаз' }
  ];
  const LEVEL = ['—', '+', '++', '+++'];

  PSY.views.drugs = function (el) {
    S.visit('drugs');
    const groups = [...new Set(PSY.drugs.map(d => d.group))];
    let g = 'all', q = '';
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Психофармакология</span>
        <h1>${PSY.drugs.length} препаратов: механизм, показания, риски</h1>
        <p>Дозировки ориентировочные, для взрослых, и нужны, чтобы понимать порядок величин. Назначение и коррекция дозы — только по официальной инструкции и решению врача.</p>
      </div>
      <div class="toolbar">
        <input class="input" id="pq" type="search" placeholder="МНН, торговое название, класс…">
        <a class="btn" href="#/compare">${ICONS.chart}Сравнить антипсихотики</a>
      </div>
      <div class="toolbar"><div class="seg" id="pg"><button type="button" class="on" data-g="all">Все</button>${groups.map(x => `<button type="button" data-g="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
      <div class="grid" id="pl"></div>`;
    const box = el.querySelector('#pl');
    const draw = () => {
      box.innerHTML = PSY.drugs.filter(d => (g === 'all' || d.group === g) &&
        (!q || (d.name + ' ' + (d.brands || '') + ' ' + d.class + ' ' + d.en).toLowerCase().includes(q)))
        .map(d => `<a class="card drug-card" href="#/drug/${d.id}">
          <span class="tag">${esc(d.class)}</span>
          <h3>${esc(d.name)}</h3><span class="en">${esc(d.en)}</span>
          <p>${esc(d.short)}</p>
        </a>`).join('') || '<p class="muted">Ничего не найдено.</p>';
    };
    el.querySelector('#pq').addEventListener('input', e => {
      q = e.target.value.trim().toLowerCase();
      // Поиск идёт по всем группам, иначе препарат «пропадает» из-за ранее выбранного фильтра.
      if (q && g !== 'all') { g = 'all'; el.querySelectorAll('#pg button').forEach(x => x.classList.toggle('on', x.dataset.g === 'all')); }
      draw();
    });
    el.querySelector('#pg').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      g = b.dataset.g;
      el.querySelectorAll('#pg button').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    draw();
  };

  const ul = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join('')}</ul>`;

  PSY.views.drug = function (el, [id]) {
    const d = PSY.drugs.find(x => x.id === id);
    if (!d) return PSY.views.notfound(el);
    el.innerHTML = `
      <nav class="crumbs"><a href="#/drugs">Препараты</a><span>/</span><span>${esc(d.group)}</span></nav>
      <div class="page-head">
        <span class="eyebrow">${esc(d.class)}</span>
        <h1>${esc(d.name)}</h1>
        <p><span class="mono">${esc(d.en)}</span>${d.brands ? ` · ${esc(d.brands)}` : ''}</p>
      </div>
      <dl class="facts">
        <dt>Механизм</dt><dd>${d.mechanism}</dd>
        <dt>Показания</dt><dd>${ul(d.indications)}</dd>
        <dt>Дозы (ориентир)</dt><dd>${d.dosing}</dd>
        <dt>Побочные эффекты</dt><dd>${ul(d.side)}</dd>
        ${d.monitoring ? `<dt>Мониторинг</dt><dd>${d.monitoring}</dd>` : ''}
        ${d.interactions ? `<dt>Взаимодействия</dt><dd>${d.interactions}</dd>` : ''}
        <dt>Главное</dt><dd>${d.pearl}</dd>
        ${d.ee ? `<dt>В Эстонии</dt><dd>${d.ee}</dd>` : ''}
      </dl>
      ${d.profile ? `<section class="section" style="max-width:860px"><h2 style="margin-bottom:12px">Профиль побочных эффектов</h2>
        <div class="table-wrap"><table class="heat"><thead><tr>${PROFILE.map(p => `<th>${p.label}</th>`).join('')}</tr></thead>
        <tbody><tr>${PROFILE.map(p => `<td class="h h${d.profile[p.k]}">${LEVEL[d.profile[p.k]]}</td>`).join('')}</tr></tbody></table></div>
        <p class="muted small" style="margin-top:8px">Качественная оценка по обзорам и руководствам (Maudsley, Huhn et al., Lancet 2019). <a href="#/compare">Сравнить с другими</a></p></section>` : ''}
      <div class="row" style="margin-top:20px">
        ${d.lesson ? `<a class="btn btn-primary" href="#/lesson/${d.lesson}">${ICONS.book}Урок по теме</a>` : ''}
        <a class="btn" href="#/drugs">${ICONS.back}Все препараты</a>
      </div>`;
  };

  const PRESETS = [
    { id: 'fep', label: 'Первый эпизод, 19 лет, переживает из-за веса', w: { weight: 3, sed: 2, eps: 2, akath: 2, prl: 2, qtc: 1, ach: 1, orth: 1 } },
    { id: 'old', label: 'Пожилой, когнитивное снижение, падения', w: { weight: 1, sed: 3, eps: 3, akath: 1, prl: 0, qtc: 2, ach: 3, orth: 3 } },
    { id: 'qtc', label: 'Удлинённый QTc на ЭКГ', w: { weight: 1, sed: 1, eps: 1, akath: 1, prl: 1, qtc: 3, ach: 1, orth: 1 } },
    { id: 'dm', label: 'Сахарный диабет 2 типа, ожирение', w: { weight: 3, sed: 1, eps: 1, akath: 1, prl: 1, qtc: 1, ach: 1, orth: 1 } },
    { id: 'prl', label: 'Молодая женщина, аменорея на прошлом препарате', w: { weight: 2, sed: 1, eps: 1, akath: 1, prl: 3, qtc: 1, ach: 0, orth: 0 } }
  ];

  PSY.views.compare = function (el) {
    S.visit('compare');
    const drugs = PSY.drugs.filter(d => d.profile);
    const weights = Object.fromEntries(PROFILE.map(p => [p.k, 1]));
    let sortKey = null;
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Интерактивное сравнение</span>
        <h1>Какой антипсихотик подойдёт этому пациенту?</h1>
        <p>По эффективности большинство антипсихотиков близки (клозапин — исключение при резистентности). Выбор обычно решают побочные эффекты. Укажите, что для пациента критично, и посмотрите, как меняется рейтинг ожидаемой нагрузки.</p>
      </div>
      <div class="toolbar"><span class="muted small">Примеры пациентов:</span>${PRESETS.map(p => `<button type="button" class="btn btn-ghost" data-p="${p.id}">${esc(p.label)}</button>`).join('')}</div>
      <div class="prio" id="prio">${PROFILE.map(p => `
        <label for="w-${p.k}">${p.label}<input type="range" id="w-${p.k}" min="0" max="3" step="1" value="1" data-k="${p.k}"><span class="muted small" data-out="${p.k}">важно</span></label>`).join('')}
      </div>
      <div class="grid-2" style="align-items:start">
        <div class="card"><h3 style="margin-bottom:12px">Ожидаемая нагрузка побочными эффектами</h3><div class="rank-list" id="rank"></div>
          <p class="muted small" style="margin-top:12px">Меньше — лучше. Это учебная модель: она не учитывает эффективность, предыдущий ответ, взаимодействия, формы введения и предпочтения пациента.</p></div>
        <div style="min-width:0"><div class="table-wrap"><table class="heat" id="heat"></table></div>
          <p class="muted small" style="margin-top:8px">Нажмите на заголовок столбца, чтобы отсортировать. «—» нет или минимально, «+++» выражено.</p></div>
      </div>`;
    const WL = ['не важно', 'учитывать', 'важно', 'критично'];
    const burden = d => PROFILE.reduce((s, p) => s + weights[p.k] * d.profile[p.k], 0);
    function draw() {
      PROFILE.forEach(p => { el.querySelector(`[data-out="${p.k}"]`).textContent = WL[weights[p.k]]; });
      const maxB = Math.max(1, ...drugs.map(burden));
      const ranked = drugs.slice().sort((a, b) => burden(a) - burden(b));
      el.querySelector('#rank').innerHTML = ranked.map((d, i) => `
        <div class="rank-item"><span class="n" style="text-align:left">${i + 1}</span><a href="#/drug/${d.id}"><b>${esc(d.name)}</b></a>${PSY.ui.bar(Math.round(burden(d) / maxB * 100))}<span class="n">${burden(d)}</span></div>`).join('');
      const rows = sortKey ? drugs.slice().sort((a, b) => b.profile[sortKey] - a.profile[sortKey]) : drugs;
      el.querySelector('#heat').innerHTML = `<thead><tr><th>Препарат</th>${PROFILE.map(p => `<th class="sortable" data-k="${p.k}">${p.label}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(d => `<tr><td><a href="#/drug/${d.id}">${esc(d.name)}</a></td>${PROFILE.map(p => `<td class="h h${d.profile[p.k]}">${LEVEL[d.profile[p.k]]}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }
    el.querySelector('#prio').addEventListener('input', e => {
      const k = e.target.dataset.k; if (!k) return;
      weights[k] = +e.target.value; draw();
    });
    el.querySelector('.toolbar').addEventListener('click', e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const p = PRESETS.find(x => x.id === b.dataset.p);
      Object.assign(weights, p.w);
      PROFILE.forEach(x => { el.querySelector('#w-' + x.k).value = weights[x.k]; });
      draw();
    });
    el.querySelector('#heat').addEventListener('click', e => {
      const th = e.target.closest('th[data-k]'); if (!th) return;
      sortKey = sortKey === th.dataset.k ? null : th.dataset.k; draw();
    });
    draw();
  };
})();

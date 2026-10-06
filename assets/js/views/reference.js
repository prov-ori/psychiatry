/* Справочники: глоссарий, расстройства, шкалы, история, мнемоники. */
(function () {
  const { ICONS, esc } = PSY.ui;
  const S = PSY.store;

  /* ---------- Глоссарий ---------- */
  PSY.views.glossary = function (el, [focus]) {
    S.visit('glossary');
    const cats = [...new Set(PSY.glossary.map(t => t.cat))];
    let cat = 'all', q = '';
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Глоссарий</span>
        <h1>${PSY.glossary.length} терминов психиатрии</h1>
        <p>Язык психопатологии точен: «бред» и «навязчивость» — разные вещи, и от этого различия зависит диагноз. Термины в уроках открываются отсюда по клику.</p>
      </div>
      <div class="toolbar">
        <input class="input" id="gq" type="search" placeholder="Найти термин…" value="">
        <select class="input" id="gc" style="max-width:260px"><option value="all">Все разделы</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select>
      </div>
      <div class="alpha" id="alpha"></div>
      <div id="glist"></div>`;
    const list = el.querySelector('#glist');
    function draw() {
      const items = PSY.glossary
        .filter(t => (cat === 'all' || t.cat === cat) && (!q || (t.term + ' ' + (t.aliases || []).join(' ') + ' ' + t.def).toLowerCase().includes(q)))
        .sort((a, b) => a.term.localeCompare(b.term, 'ru'));
      const groups = {};
      items.forEach(t => { const L = t.term[0].toUpperCase(); (groups[L] = groups[L] || []).push(t); });
      const letters = Object.keys(groups);
      el.querySelector('#alpha').innerHTML = letters.map(L => `<a href="#" data-l="${L}">${L}</a>`).join('');
      list.innerHTML = letters.map(L => `<div class="letter" id="L-${L}">${L}</div><div class="gloss-list">${groups[L].map(t => `
        <div class="gloss" id="g-${esc(t.term)}"><h3>${esc(t.term)} <span class="tag">${esc(t.cat)}</span></h3>
        ${t.aliases && t.aliases.length ? `<div class="muted small">Также: ${esc(t.aliases.join(', '))}</div>` : ''}
        <p>${t.def}</p></div>`).join('')}</div>`).join('') || '<p class="muted">Ничего не найдено.</p>';
      PSY.ui.bindTerms(list);
    }
    el.querySelector('#gq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
    el.querySelector('#gc').addEventListener('change', e => { cat = e.target.value; draw(); });
    el.querySelector('#alpha').addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return; e.preventDefault();
      document.getElementById('L-' + a.dataset.l).scrollIntoView({ behavior: 'smooth' });
    });
    draw();
    if (focus) {
      const t = PSY.term(focus);
      const node = t && document.getElementById('g-' + t.term);
      if (node) { node.classList.add('hl'); setTimeout(() => node.scrollIntoView({ block: 'center' }), 30); }
    }
  };

  /* ---------- Расстройства ---------- */
  PSY.views.disorders = function (el) {
    S.visit('disorders');
    const sections = [...new Set(PSY.disorders.map(d => d.section))];
    let q = '';
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Справочник расстройств</span>
        <h1>${PSY.disorders.length} расстройств: коды, критерии, лечение</h1>
        <p>Краткие клинические карточки с кодами МКБ-10 (действует в РФ) и МКБ-11 (вступила в силу в ВОЗ с 2022 года). Критерии изложены своими словами и упрощены — для обучения, не для экспертизы.</p>
      </div>
      <div class="toolbar"><input class="input" id="dq" type="search" placeholder="Название или код: F32, 6A20…"></div>
      <div id="dlist"></div>`;
    const box = el.querySelector('#dlist');
    function draw() {
      box.innerHTML = sections.map(sec => {
        const items = PSY.disorders.filter(d => d.section === sec && (!q || (d.name + d.icd10 + d.icd11 + (d.aka || '')).toLowerCase().includes(q)));
        if (!items.length) return '';
        return `<section class="section" style="margin-top:22px"><h2 style="margin-bottom:12px;font-size:18px">${esc(sec)}</h2><div class="grid">
          ${items.map(d => `<a class="card drug-card" href="#/disorder/${d.id}">
            <div class="row" style="gap:6px"><span class="code">${esc(d.icd10)}</span><span class="code">${esc(d.icd11)}</span></div>
            <h3>${esc(d.name)}</h3><p>${esc(d.core)}</p></a>`).join('')}
        </div></section>`;
      }).join('') || '<p class="muted">Ничего не найдено.</p>';
    }
    el.querySelector('#dq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); draw(); });
    draw();
  };

  const list = arr => `<ul>${arr.map(x => `<li>${x}</li>`).join('')}</ul>`;

  PSY.views.disorder = function (el, [id]) {
    const d = PSY.disorders.find(x => x.id === id);
    if (!d) return PSY.views.notfound(el);
    const lesson = d.lesson && PSY.lesson(d.lesson);
    el.innerHTML = `
      <nav class="crumbs"><a href="#/disorders">Расстройства</a><span>/</span><span>${esc(d.section)}</span></nav>
      <div class="page-head">
        <div class="row" style="gap:6px"><span class="code">МКБ-10 ${esc(d.icd10)}</span><span class="code">МКБ-11 ${esc(d.icd11)}</span></div>
        <h1>${esc(d.name)}</h1>
        <p>${esc(d.core)}</p>
      </div>
      <dl class="facts">
        <dt>Ключевые признаки</dt><dd>${list(d.criteria)}</dd>
        ${d.duration ? `<dt>Длительность</dt><dd>${d.duration}</dd>` : ''}
        ${d.epidemiology ? `<dt>Эпидемиология</dt><dd>${d.epidemiology}</dd>` : ''}
        <dt>Дифференциальный диагноз</dt><dd>${list(d.differential)}</dd>
        <dt>Лечение</dt><dd>${list(d.treatment)}</dd>
        ${d.prognosis ? `<dt>Течение и прогноз</dt><dd>${d.prognosis}</dd>` : ''}
      </dl>
      <div class="row" style="margin-top:20px">
        ${lesson ? `<a class="btn btn-primary" href="#/lesson/${lesson.id}">${ICONS.book}Урок: ${esc(lesson.title)}</a>` : ''}
        <a class="btn" href="#/disorders">${ICONS.back}Все расстройства</a>
      </div>`;
  };

  /* ---------- Шкалы ---------- */
  PSY.views.scales = function (el) {
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Психометрические шкалы</span>
        <h1>Инструменты, которыми пользуются клиницисты</h1>
        <p>Скрининговые шкалы не ставят диагноз: они показывают, кому нужна полноценная оценка, и помогают отслеживать динамику. Здесь можно заполнить шкалу на учебном примере и увидеть, как считается результат.</p>
      </div>
      <div class="grid">${PSY.scales.map(s => `
        <a class="card drug-card" href="#/scale/${s.id}">
          <div class="row" style="justify-content:space-between"><span class="tag tag-accent">${esc(s.who)}</span><span class="muted small">${s.items.length} пунктов</span></div>
          <h3>${esc(s.name)}</h3><span class="en">${esc(s.full)}</span><p>${esc(s.purpose)}</p>
        </a>`).join('')}</div>`;
  };

  PSY.views.scale = function (el, [id]) {
    const s = PSY.scales.find(x => x.id === id);
    if (!s) return PSY.views.notfound(el);
    S.markScale(id);
    el.innerHTML = `
      <nav class="crumbs"><a href="#/scales">Шкалы</a><span>/</span><span>${esc(s.name)}</span></nav>
      <div class="page-head">
        <span class="eyebrow">${esc(s.who)} · ${esc(s.period || '')}</span>
        <h1>${esc(s.name)}</h1>
        <p>${esc(s.full)}. ${esc(s.purpose)}</p>
      </div>
      <div class="card" style="max-width:860px">
        ${s.instruction ? `<p class="muted" style="margin-bottom:6px">${s.instruction}</p>` : ''}
        <form id="sf" onsubmit="return false">
          ${s.items.map((it, i) => {
            const opts = it.options || s.options;
            return `<div class="scale-item"><div class="scale-q"><span>${i + 1}.</span>${it.q}</div>
              <div class="scale-opts">${opts.map((o, k) => `<label><input type="radio" name="i${i}" id="s-${s.id}-${i}-${k}" value="${o.value}"><span>${esc(o.label)}</span></label>`).join('')}</div></div>`;
          }).join('')}
        </form>
        <div class="scale-result" id="sr"></div>
      </div>
      <section class="section" style="max-width:860px">
        <h2 style="margin-bottom:10px">Интерпретация</h2>
        <div class="table-wrap"><table><thead><tr><th>Баллы</th><th>Значение</th></tr></thead><tbody>
          ${s.bands.map(b => `<tr><td class="mono">${esc(b.range)}</td><td>${b.label}</td></tr>`).join('')}
        </tbody></table></div>
        ${s.notes ? `<div class="prose" style="margin-top:16px;font-size:15.5px">${s.notes}</div>` : ''}
      </section>`;
    const form = el.querySelector('#sf');
    const out = el.querySelector('#sr');
    function calc() {
      const vals = s.items.map((_, i) => {
        const c = form.querySelector(`input[name="i${i}"]:checked`);
        return c ? +c.value : null;
      });
      const answered = vals.filter(v => v !== null).length;
      const res = s.compute ? s.compute(vals) : defaultCompute(s, vals);
      const extra = s.alert ? s.alert(vals) : '';
      out.innerHTML = `
        <div><div class="big">${res.score}${res.max ? `<span class="muted" style="font-size:16px"> / ${res.max}</span>` : ''}</div><div class="muted small">отвечено ${answered} из ${s.items.length}</div></div>
        <div style="flex:1;min-width:200px">${answered < s.items.length ? '<span class="muted">Заполните все пункты, чтобы увидеть интерпретацию.</span>' : `<b>${res.label}</b>`}</div>
        ${extra ? `<div class="crisis" style="flex-basis:100%">${extra}</div>` : ''}`;
    }
    form.addEventListener('change', calc);
    calc();
  };
  function defaultCompute(s, vals) {
    const score = vals.reduce((a, v) => a + (v || 0), 0);
    const max = s.items.reduce((a, it) => a + Math.max(...(it.options || s.options).map(o => o.value)), 0);
    const band = s.bands.find(b => score >= b.min && score <= b.max) || s.bands[s.bands.length - 1];
    return { score, max, label: band.label };
  }

  /* ---------- История ---------- */
  PSY.views.timeline = function (el) {
    S.visit('timeline');
    const eras = [...new Set(PSY.timeline.map(t => t.era))];
    let era = 'all';
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">История психиатрии</span>
        <h1>Как мы научились понимать и лечить психические расстройства</h1>
        <p>От трепанаций и «одержимости» до клозапина, МКБ-11 и первых антипсихотиков без блокады дофамина. История объясняет, почему современная психиатрия устроена именно так — и почему она так осторожна.</p>
      </div>
      <div class="toolbar"><div class="seg" id="eras"><button type="button" data-e="all" class="on">Все эпохи</button>${eras.map(e => `<button type="button" data-e="${esc(e)}">${esc(e)}</button>`).join('')}</div></div>
      <div class="timeline" id="tl"></div>`;
    const tl = el.querySelector('#tl');
    const draw = () => {
      tl.innerHTML = PSY.timeline.filter(t => era === 'all' || t.era === era).map(t => `
        <div class="tl-item"><div class="tl-year">${esc(t.year)}</div><h3>${esc(t.title)}</h3><p>${t.text}</p></div>`).join('');
      PSY.ui.bindTerms(tl);
    };
    el.querySelector('#eras').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      era = b.dataset.e;
      el.querySelectorAll('#eras button').forEach(x => x.classList.toggle('on', x === b));
      draw();
    });
    draw();
  };

  /* ---------- Мнемоники ---------- */
  PSY.views.mnemonics = function (el) {
    S.visit('mnemonics');
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Мнемоники</span>
        <h1>Как запомнить критерии и списки</h1>
        <p>Классические англоязычные мнемоники с русской расшифровкой и несколько русскоязычных. Все они есть в колоде карточек «Мнемоники».</p>
      </div>
      <div class="grid-2">${PSY.mnemonics.map(m => `
        <div class="card mn">
          <span class="eyebrow">${esc(m.topic)}</span>
          <div class="mn-key">${esc(m.key)}</div>
          <ul>${m.items.map(i => `<li>${i}</li>`).join('')}</ul>
          ${m.note ? `<p class="muted small">${m.note}</p>` : ''}
        </div>`).join('')}</div>`;
  };
})();

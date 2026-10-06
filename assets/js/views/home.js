/* Главная: пятно Роршаха дня, прогресс, «продолжить», уровни, инструменты. */
(function () {
  const { ICONS, ring, bar, esc, seeded } = PSY.ui;
  const S = PSY.store;

  function nextLesson() {
    for (const lv of PSY.levels) for (const l of lv.lessons) {
      if (!(S.state.lessons[l.id] && S.state.lessons[l.id].done)) return { lv, l };
    }
    return null;
  }

  // Симметричное «чернильное пятно»: сумма гауссовых капель, порог и зеркальное отражение.
  function drawBlot(canvas, seedStr) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const rnd = seeded(seedStr);
    const cs = getComputedStyle(document.documentElement);
    const ink = cs.getPropertyValue('--accent').trim() || '#2443c4';
    const paper = cs.getPropertyValue('--surface').trim() || '#ffffff';
    const toRGB = hex => {
      const c = document.createElement('canvas').getContext('2d');
      c.fillStyle = hex; c.fillRect(0, 0, 1, 1);
      return c.getImageData(0, 0, 1, 1).data;
    };
    const ci = toRGB(ink), cp = toRGB(paper);
    const blobs = [];
    const n = 26 + Math.floor(rnd() * 16);
    for (let i = 0; i < n; i++) {
      const spread = Math.pow(rnd(), 0.9);
      blobs.push({
        x: spread * W * 0.36,
        y: H * (0.16 + rnd() * 0.68),
        s: (0.012 + Math.pow(rnd(), 1.6) * 0.05) * W,
        w: 0.45 + rnd() * 0.5
      });
    }
    // Брызги
    for (let i = 0; i < 14; i++) {
      blobs.push({ x: W * (0.06 + rnd() * 0.36), y: H * (0.08 + rnd() * 0.84), s: (0.003 + rnd() * 0.006) * W, w: 1.3 });
    }
    const f1 = 0.02 + rnd() * 0.03, f2 = 0.03 + rnd() * 0.04, ph = rnd() * 6.28;
    const img = ctx.createImageData(W, H);
    const cx = W / 2;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = Math.abs(x - cx);
        let v = 0;
        for (const b of blobs) {
          const ex = dx - b.x, ey = y - b.y;
          v += b.w * Math.exp(-(ex * ex + ey * ey) / (2 * b.s * b.s));
        }
        v += 0.1 * Math.sin(dx * f1 + ph) * Math.cos(y * f2 - ph) + 0.05 * Math.sin(dx * f2 * 2.7 + y * f1 * 3.1);
        const a = Math.min(1, Math.max(0, (v - 0.55) / 0.06));
        const k = (y * W + x) * 4;
        img.data[k] = cp[0] + (ci[0] - cp[0]) * a;
        img.data[k + 1] = cp[1] + (ci[1] - cp[1]) * a;
        img.data[k + 2] = cp[2] + (ci[2] - cp[2]) * a;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  PSY.views.home = function (el) {
    const st = S.state;
    const total = PSY.allLessons().length;
    const done = S.doneCount();
    const nx = nextLesson();
    const r = S.rank();
    const learnedCards = Object.keys(st.cards).length;
    const casesDone = Object.keys(st.cases).length;
    const dailyDone = st.daily[S.today()] !== undefined;
    const isNew = st.xp === 0;

    el.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="eyebrow">Интерактивный курс психиатрии</span>
          <h1>От первого вопроса «что такое бред?» до <em>резистентной шизофрении</em> и клозапина</h1>
          <p>${PSY.levels.length} уровней, ${total} уроков с тестами, ${PSY.cases.length} клинических случаев, тренажёры, карточки с интервальным повторением и справочники. Можно начинать без медицинского образования.</p>
          <div class="row">
            ${nx ? `<a class="btn btn-primary" href="#/lesson/${nx.l.id}">${ICONS.arrow}${isNew ? 'Начать с нуля' : 'Продолжить обучение'}</a>` : `<a class="btn btn-primary" href="#/exam">${ICONS.exam}Итоговый экзамен</a>`}
            <a class="btn" href="#/path">${ICONS.path}Весь путь</a>
          </div>
        </div>
        <figure class="blot-wrap" style="margin:0">
          <canvas id="blot" width="480" height="360" aria-label="Симметричное чернильное пятно в стиле теста Роршаха"></canvas>
          <figcaption class="blot-caption"><span><b>Пятно дня.</b> Что вы видите?</span><span>Нажмите — новое</span></figcaption>
        </figure>
      </section>

      <section class="stats">
        <div class="stat"><b>${st.xp}</b><span>опыта · ${esc(r.current.title)}</span></div>
        <div class="stat"><b>${done}/${total}</b><span>уроков пройдено</span></div>
        <div class="stat"><b>${casesDone}/${PSY.cases.length}</b><span>случаев разобрано</span></div>
        <div class="stat"><b>${learnedCards}</b><span>карточек в повторении</span></div>
        <div class="stat"><b>${S.streak()}</b><span>дней подряд</span></div>
      </section>

      ${nx ? `
      <section class="section">
        <div class="card continue">
          ${ring(Math.round(done / total * 100), 64)}
          <div class="continue-body">
            <span class="eyebrow">${isNew ? 'Первый урок' : 'Следующий урок'} · уровень ${nx.lv.num}</span>
            <h2>${esc(nx.l.title)}</h2>
            <p class="muted">${esc(nx.l.summary || '')}</p>
          </div>
          <a class="btn btn-primary" href="#/lesson/${nx.l.id}">Открыть ${ICONS.arrow}</a>
        </div>
      </section>` : ''}

      <section class="section">
        <div class="section-head"><h2>Уровни</h2><a href="#/path">Подробнее</a></div>
        <div class="levels-strip">
          ${PSY.levels.map(lv => {
            const p = S.levelProgress(lv.id);
            return `<a class="lv-tile" style="--c:var(--lv${lv.num})" href="#/path#${lv.id}">
              <span class="lv-num">${lv.num}</span>
              <span class="lv-title">${esc(lv.title)}</span>
              ${bar(p.pct)}
              <span class="muted small">${p.done} из ${p.total}</span>
            </a>`;
          }).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Практика</h2></div>
        <div class="tools">
          <a class="tool" href="#/daily"><span class="tool-ico">${ICONS.bolt}</span><div><b>Вызов дня ${dailyDone ? '· выполнен' : ''}</b><span>6 вопросов, одинаковых для всех сегодня</span></div></a>
          <a class="tool" href="#/cases"><span class="tool-ico">${ICONS.case}</span><div><b>Клинические случаи</b><span>Ведите пациента: решения, ошибки, разбор</span></div></a>
          <a class="tool" href="#/symptoms"><span class="tool-ico">${ICONS.eye}</span><div><b>Тренажёр феноменов</b><span>Узнайте симптом по словам пациента</span></div></a>
          <a class="tool" href="#/cards"><span class="tool-ico">${ICONS.cards}</span><div><b>Карточки</b><span>Интервальное повторение терминов и препаратов</span></div></a>
          <a class="tool" href="#/compare"><span class="tool-ico">${ICONS.chart}</span><div><b>Подбор антипсихотика</b><span>Сравните побочные эффекты под конкретного пациента</span></div></a>
          <a class="tool" href="#/exam"><span class="tool-ico">${ICONS.exam}</span><div><b>Пробный экзамен</b><span>Вопросы по выбранным уровням, с таймером</span></div></a>
        </div>
      </section>

      ${isNew ? `
      <section class="section">
        <div class="card">
          <h2 style="margin-bottom:10px">Как здесь учиться</h2>
          <div class="grid-2">
            <p><b>1. Идите по уровням.</b> Уровень 0 не требует знаний: что такое психиатрия, норма и патология, права пациента. Дальше — мозг, язык симптомов, конкретные расстройства, лечение и экспертные темы.</p>
            <p><b>2. Закрепляйте.</b> После каждого урока — тест с разбором. Подчёркнутые пунктиром термины открывают определение по клику.</p>
            <p><b>3. Применяйте.</b> Клинические случаи учат решать в условиях неопределённости. Тренажёр феноменов учит слышать симптом в речи пациента.</p>
            <p><b>4. Повторяйте.</b> Карточки сами напоминают, что пора повторить. Прогресс хранится в этом браузере; перенести его можно в настройках.</p>
          </div>
        </div>
      </section>` : ''}
    `;

    const canvas = el.querySelector('#blot');
    let seed = S.today();
    const paint = () => { try { drawBlot(canvas, seed); } catch (e) { /* canvas недоступен */ } };
    requestAnimationFrame(paint);
    canvas.addEventListener('click', () => { seed = String(Math.random()); paint(); });
    // Пятно рисуется цветами темы — перерисовываем при её смене (в том числе системной).
    const repaint = () => { if (!document.body.contains(canvas)) { cleanup(); return; } requestAnimationFrame(paint); };
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const cleanup = () => { document.removeEventListener('psy:theme', repaint); if (mq && mq.removeEventListener) mq.removeEventListener('change', repaint); };
    document.addEventListener('psy:theme', repaint);
    if (mq && mq.addEventListener) mq.addEventListener('change', repaint);
  };
})();

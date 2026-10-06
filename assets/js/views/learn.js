/* Путь обучения и страница урока с тестом. */
(function () {
  const { ICONS, esc, bar, ring, question } = PSY.ui;
  const S = PSY.store;

  PSY.views.path = function (el) {
    const total = PSY.allLessons().length;
    el.innerHTML = `
      <div class="page-head">
        <span class="eyebrow">Путь обучения</span>
        <h1>Шесть уровней: от нуля до экспертного</h1>
        <p>Уровни выстроены так, чтобы каждый опирался на предыдущий. Порядок рекомендован, но не обязателен: если вы уже знаете основы, начните с нужного места. Всего ${total} уроков.</p>
      </div>
      ${PSY.levels.map(lv => {
        const p = S.levelProgress(lv.id);
        return `
        <section class="level" id="${lv.id}" style="--c:var(--lv${lv.num})">
          <div class="level-rail"><div class="level-badge">${lv.num}</div><div class="level-line"></div></div>
          <div class="level-body">
            <div class="level-head">
              <div>
                <span class="eyebrow">Уровень ${lv.num} · ${esc(lv.audience)}</span>
                <h2>${esc(lv.title)}</h2>
              </div>
              <div class="level-meta">${bar(p.pct)}<span>${p.done}/${p.total}</span></div>
            </div>
            <p class="level-sub">${lv.description}</p>
            <div class="lessons">
              ${lv.lessons.map((l, i) => {
                const rec = S.state.lessons[l.id];
                return `<a class="lesson-link" href="#/lesson/${l.id}">
                  <span class="lesson-n">${lv.num}.${i + 1}</span>
                  <span class="ll-body"><b>${esc(l.title)}</b><small>${l.minutes} мин · ${l.quiz.length} ${PSY.ui.plural(l.quiz.length, 'вопрос', 'вопроса', 'вопросов')}${rec && rec.done ? ` · лучший результат ${rec.best}%` : ''}</small></span>
                  <span class="lesson-state ${rec && rec.done ? 'done' : ''}">${rec && rec.done ? ICONS.check : ''}</span>
                </a>`;
              }).join('')}
            </div>
          </div>
        </section>`;
      }).join('')}`;
  };

  PSY.views.lesson = function (el, [id]) {
    const lesson = PSY.lesson(id);
    if (!lesson) return PSY.views.notfound(el);
    const lv = PSY.levelOf(id);
    const all = PSY.allLessons();
    const idx = all.findIndex(l => l.id === id);
    const prev = all[idx - 1], next = all[idx + 1];
    const n = lv.lessons.indexOf(lesson) + 1;
    const rec = S.state.lessons[id];

    el.innerHTML = `
      <nav class="crumbs"><a href="#/path">Путь</a><span>/</span><a href="#/path#${lv.id}">Уровень ${lv.num}. ${esc(lv.title)}</a></nav>
      <div class="lesson-layout">
        <article>
          <header class="lesson-head">
            <span class="eyebrow" style="color:var(--lv${lv.num})">Урок ${lv.num}.${n} · ${lesson.minutes} мин чтения</span>
            <h1>${esc(lesson.title)}</h1>
            <p class="lead">${esc(lesson.summary)}</p>
          </header>
          <div class="prose" id="lessonBody">${lesson.content}</div>
          ${lesson.keyPoints && lesson.keyPoints.length ? `
          <section class="keypoints">
            <h2>Главное из урока</h2>
            <ul>${lesson.keyPoints.map(k => `<li><span>${k}</span></li>`).join('')}</ul>
          </section>` : ''}
          <section class="quiz" id="quiz">
            <div>
              <h2>Проверьте себя</h2>
              <p class="muted">${lesson.quiz.length} ${PSY.ui.plural(lesson.quiz.length, 'вопрос', 'вопроса', 'вопросов')}. Разбор появится сразу после ответа.</p>
            </div>
            <div id="qList" style="display:flex;flex-direction:column;gap:16px"></div>
            <div id="qResult"></div>
          </section>
          <nav class="lesson-nav">
            ${prev ? `<a class="btn" href="#/lesson/${prev.id}">${ICONS.back}${esc(prev.title)}</a>` : '<span></span>'}
            ${next ? `<a class="btn" href="#/lesson/${next.id}">${esc(next.title)}${ICONS.arrow}</a>` : `<a class="btn btn-primary" href="#/exam">Итоговый экзамен${ICONS.arrow}</a>`}
          </nav>
        </article>
        <aside class="lesson-aside">
          <div class="card">
            <div class="row" style="gap:14px">
              ${ring(rec ? rec.best : 0, 52)}
              <div><b>${rec && rec.done ? 'Урок пройден' : 'Не пройден'}</b><div class="muted small">${rec && rec.done ? 'Лучший результат теста' : 'Ответьте на вопросы в конце'}</div></div>
            </div>
          </div>
          <div class="card toc-card"><div class="eyebrow" style="margin-bottom:8px">Содержание</div><nav class="toc" id="toc"></nav></div>
          ${related(lesson).length ? `<div class="card"><div class="eyebrow" style="margin-bottom:8px">Связанное</div>
            <div class="toc">${related(lesson).map(r => `<a href="${r.href}"><span class="muted small">${r.kind}</span> ${esc(r.label)}</a>`).join('')}</div></div>` : ''}
        </aside>
      </div>`;

    // Оглавление из подзаголовков урока
    const toc = el.querySelector('#toc');
    el.querySelectorAll('#lessonBody h3').forEach((h, i) => {
      h.id = 'sec-' + (i + 1);
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = h.textContent;
      a.addEventListener('click', e => { e.preventDefault(); h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      toc.appendChild(a);
    });
    const qa = document.createElement('a');
    qa.href = '#'; qa.textContent = 'Проверьте себя';
    qa.addEventListener('click', e => { e.preventDefault(); el.querySelector('#quiz').scrollIntoView({ behavior: 'smooth' }); });
    toc.appendChild(qa);

    // Таблицы в уроках оборачиваем для горизонтальной прокрутки на телефоне
    el.querySelectorAll('#lessonBody table').forEach(t => {
      if (t.parentElement.classList.contains('table-wrap')) return;
      const w = document.createElement('div'); w.className = 'table-wrap';
      t.replaceWith(w); w.appendChild(t);
    });

    runQuiz(el, lesson, next);
  };

  // Клинические случаи, расстройства и препараты, которые ссылаются на урок.
  function related(lesson) {
    const out = (lesson.related || []).map(r => Object.assign({ kind: '' }, r));
    PSY.cases.filter(c => (c.links || []).includes(lesson.id)).forEach(c => out.push({ kind: 'Случай', label: c.title, href: '#/case/' + c.id }));
    PSY.disorders.filter(d => d.lesson === lesson.id).forEach(d => out.push({ kind: 'Расстройство', label: d.name, href: '#/disorder/' + d.id }));
    PSY.drugs.filter(d => d.lesson === lesson.id).forEach(d => out.push({ kind: 'Препарат', label: d.name, href: '#/drug/' + d.id }));
    return out.slice(0, 12);
  }

  function runQuiz(el, lesson, next) {
    const list = el.querySelector('#qList');
    const out = el.querySelector('#qResult');
    list.innerHTML = ''; out.innerHTML = '';
    let answered = 0, correct = 0;
    lesson.quiz.forEach((q, i) => question(list, q, {
      number: `Вопрос ${i + 1} из ${lesson.quiz.length}`,
      onAnswer(ok) {
        S.recordAnswer(lesson.id + '#' + i, ok);
        answered++; if (ok) correct++;
        if (answered === lesson.quiz.length) {
          const res = S.completeLesson(lesson.id, correct, lesson.quiz.length);
          const msg = res.pct === 100 ? 'Безупречно.' : res.pct >= 70 ? 'Хороший результат.' : 'Стоит перечитать урок и попробовать ещё раз.';
          out.innerHTML = `<div class="card result">
            ${ring(res.pct, 72)}
            <div class="result-body"><h3>${correct} из ${lesson.quiz.length} верно</h3><p class="muted">${msg}${res.first ? ' Урок отмечен как пройденный.' : ''}</p></div>
            <div class="row">
              <button type="button" class="btn" id="retry">Пройти заново</button>
              ${next ? `<a class="btn btn-primary" href="#/lesson/${next.id}">Следующий урок ${ICONS.arrow}</a>` : ''}
            </div></div>`;
          out.querySelector('#retry').addEventListener('click', () => { runQuiz(el, lesson, next); el.querySelector('#quiz').scrollIntoView({ behavior: 'smooth' }); });
        }
      }
    }));
  }
})();

#!/usr/bin/env node
/* Проверка целостности контента: уникальность id, корректность ответов тестов,
   ссылки на уроки и термины глоссария. Запуск: node tools/validate.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(s => s.startsWith('data/') || s.endsWith('core.js'));

const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
const PSY = ctx.PSY;

const errors = [];
const warn = [];
const err = m => errors.push(m);

// Уроки
const ids = new Set();
const lessons = PSY.allLessons();
for (const l of lessons) {
  if (ids.has(l.id)) err(`Дубликат id урока ${l.id}`);
  ids.add(l.id);
  for (const f of ['title', 'summary', 'content', 'minutes']) if (!l[f]) err(`${l.id}: нет поля ${f}`);
  if (!l.quiz || l.quiz.length < 3) err(`${l.id}: в тесте меньше 3 вопросов`);
  (l.quiz || []).forEach((q, i) => checkQ(q, `${l.id} вопрос ${i + 1}`));
}
function checkQ(q, where) {
  if (!q.q || !Array.isArray(q.options) || q.options.length < 2) return err(`${where}: некорректный вопрос`);
  const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
  if (!ans.length) err(`${where}: нет ответа`);
  ans.forEach(a => { if (!Number.isInteger(a) || a < 0 || a >= q.options.length) err(`${where}: ответ ${a} вне диапазона`); });
  if (new Set(q.options).size !== q.options.length) err(`${where}: повторяющиеся варианты`);
  if (!q.explain) warn.push(`${where}: нет разбора`);
}

// Термины в тексте
const termRe = /<span class="t"(?: data-t="([^"]+)")?>([^<]+)<\/span>/g;
function checkTerms(text, where) {
  for (const m of String(text).matchAll(termRe)) {
    const key = m[1] || m[2];
    if (!PSY.term(key)) err(`${where}: термин «${key}» отсутствует в глоссарии`);
  }
}
lessons.forEach(l => { checkTerms(l.content, l.id); (l.quiz || []).forEach(q => checkTerms(q.explain, l.id)); });

// Глоссарий
const terms = new Set();
PSY.glossary.forEach(t => {
  const k = t.term.toLowerCase();
  if (terms.has(k)) err(`Глоссарий: дубликат «${t.term}»`);
  terms.add(k);
  if (!t.def || !t.cat) err(`Глоссарий: «${t.term}» без определения или раздела`);
});

// Случаи
const caseIds = new Set();
PSY.cases.forEach(c => {
  if (caseIds.has(c.id)) err(`Дубликат случая ${c.id}`);
  caseIds.add(c.id);
  if (!c.stages || !c.stages.length) err(`${c.id}: нет шагов`);
  (c.stages || []).forEach((s, i) => {
    if (!s.options || s.options.length < 2) err(`${c.id} шаг ${i + 1}: мало вариантов`);
    if (!s.options.some(o => o.score === 2)) err(`${c.id} шаг ${i + 1}: нет лучшего варианта (score 2)`);
    s.options.forEach(o => { if (!o.feedback) err(`${c.id} шаг ${i + 1}: вариант без обратной связи`); });
    checkTerms(s.text || '', c.id);
  });
  (c.links || []).forEach(id => { if (!ids.has(id)) err(`${c.id}: ссылка на несуществующий урок ${id}`); });
  checkTerms(c.intro, c.id); checkTerms(c.debrief, c.id);
});

// Препараты и расстройства
const drugIds = new Set();
PSY.drugs.forEach(d => {
  if (drugIds.has(d.id)) err(`Дубликат препарата ${d.id}`);
  drugIds.add(d.id);
  for (const f of ['name', 'en', 'class', 'group', 'mechanism', 'indications', 'dosing', 'side', 'pearl', 'short']) if (!d[f]) err(`Препарат ${d.id}: нет поля ${f}`);
  if (d.lesson && !ids.has(d.lesson)) err(`Препарат ${d.id}: нет урока ${d.lesson}`);
  if (d.profile) ['weight', 'sed', 'eps', 'akath', 'prl', 'qtc', 'ach', 'orth'].forEach(k => {
    if (![0, 1, 2, 3].includes(d.profile[k])) err(`Препарат ${d.id}: профиль ${k} некорректен`);
  });
});
const disIds = new Set();
PSY.disorders.forEach(d => {
  if (disIds.has(d.id)) err(`Дубликат расстройства ${d.id}`);
  disIds.add(d.id);
  for (const f of ['name', 'section', 'icd10', 'icd11', 'core', 'criteria', 'differential', 'treatment']) if (!d[f]) err(`Расстройство ${d.id}: нет поля ${f}`);
  if (d.lesson && !ids.has(d.lesson)) err(`Расстройство ${d.id}: нет урока ${d.lesson}`);
});

// Шкалы
PSY.scales.forEach(s => {
  if (!s.items.length) err(`Шкала ${s.id}: нет пунктов`);
  s.items.forEach((it, i) => { if (!(it.options || s.options)) err(`Шкала ${s.id} пункт ${i + 1}: нет вариантов`); });
  if (!s.bands || !s.bands.length) err(`Шкала ${s.id}: нет интерпретации`);
});

// Феномены
PSY.symptoms.forEach((s, i) => {
  if (!s.quote || !s.answer || !s.category || !s.explain) err(`Феномен ${i + 1}: неполные данные`);
});
const answersByCat = {};
PSY.symptoms.forEach(s => { (answersByCat[s.category] = answersByCat[s.category] || new Set()).add(s.answer); });

// Ссылки на уроки в разделе «Связанное»
lessons.forEach(l => (l.related || []).forEach(r => {
  const m = /^#\/lesson\/(.+)$/.exec(r.href);
  if (m && !ids.has(m[1])) err(`${l.id}: связанная ссылка на несуществующий урок ${m[1]}`);
}));

// Длина вариантов не должна подсказывать ответ: правильный не должен быть заметно длиннее остальных.
const plain = x => String(x).replace(/<[^>]+>/g, '');
let single = 0, longestCorrect = 0;
const tells = [];
function lengthTell(options, correct, where) {
  const L = options.map(o => plain(o).length);
  const others = L.filter((_, i) => !correct.includes(i));
  const top = Math.max(...L);
  if (correct.length === 1) { single++; if (L[correct[0]] === top) longestCorrect++; }
  if (correct.length === 1 && correct.some(i => L[i] === top) && top > 25 && top > 1.3 * Math.max(...others)) tells.push(where);
}
lessons.forEach(l => l.quiz.forEach((q, i) => lengthTell(q.options, Array.isArray(q.answer) ? q.answer : [q.answer], `${l.id} вопрос ${i + 1}`)));
PSY.cases.forEach(c => c.stages.forEach((st, i) => lengthTell(st.options.map(o => o.text), [st.options.findIndex(o => o.score === 2)], `${c.id} шаг ${i + 1}`)));
const share = Math.round(longestCorrect / single * 100);
if (share > 50) err(`Правильный ответ — самый длинный в ${share}% вопросов: длина подсказывает ответ`);
tells.forEach(w => err(`${w}: правильный вариант заметно длиннее остальных`));

const quizCount = lessons.reduce((s, l) => s + l.quiz.length, 0);
console.log(`Уровней: ${PSY.levels.length}, уроков: ${lessons.length}, вопросов: ${quizCount}; правильный = самый длинный: ${share}%`);
console.log(`Глоссарий: ${PSY.glossary.length}, препаратов: ${PSY.drugs.length}, расстройств: ${PSY.disorders.length}`);
console.log(`Случаев: ${PSY.cases.length}, феноменов: ${PSY.symptoms.length}, шкал: ${PSY.scales.length}, событий истории: ${PSY.timeline.length}, мнемоник: ${PSY.mnemonics.length}`);
if (warn.length) console.log(`Предупреждений: ${warn.length}\n  ` + warn.slice(0, 20).join('\n  '));
if (errors.length) {
  console.error(`\nОШИБОК: ${errors.length}\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('OK');

/* Общее пространство имён. Файлы data/*.js наполняют его контентом,
   assets/js/*.js — логикой. Порядок подключения задан в index.html. */
window.PSY = {
  levels: [],      // уровни пути обучения с уроками
  glossary: [],    // термины
  drugs: [],       // препараты
  disorders: [],   // справочник расстройств
  cases: [],       // клинические случаи
  symptoms: [],    // тренажёр феноменов
  scales: [],      // психометрические шкалы
  timeline: [],    // история психиатрии
  mnemonics: [],   // мнемоники
  views: {},       // обработчики маршрутов

  addLevel(level) {
    this.levels.push(level);
    this.levels.sort((a, b) => a.num - b.num);
  },
  // Уровень 3 большой и разбит на два файла: вторая часть дописывает уроки.
  extendLevel(id, lessons) {
    const level = this.levels.find(l => l.id === id);
    if (!level) throw new Error('Неизвестный уровень ' + id);
    level.lessons.push(...lessons);
  },
  allLessons() {
    return this.levels.flatMap(l => l.lessons.map(ls => Object.assign(ls, { levelId: l.id })));
  },
  lesson(id) {
    return this.allLessons().find(l => l.id === id);
  },
  levelOf(lessonId) {
    return this.levels.find(l => l.lessons.some(ls => ls.id === lessonId));
  },
  term(key) {
    const k = String(key).toLowerCase();
    return this.glossary.find(t => t.term.toLowerCase() === k || (t.aliases || []).some(a => a.toLowerCase() === k));
  }
};

#!/usr/bin/env node
/* Собирает всю платформу в один HTML-файл (dist/psychiatry.html), который можно открыть
   без сервера или отправить кому-то. Запуск: node tools/build-single.js
   Флаг --fragment выводит версию без <html>/<head>/<body> (для встраивания). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const fragment = process.argv.includes('--fragment');
const out = process.argv.find(a => a.startsWith('--out='));
const outPath = out ? out.slice(6) : path.join(root, 'dist', fragment ? 'psychiatry-fragment.html' : 'psychiatry.html');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/main.css'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
let js = scripts.map(s => `/* ${s} */\n` + fs.readFileSync(path.join(root, s), 'utf8').replace(/<\/script/gi, '<\\/script')).join('\n;\n');
// Во встраиваемой версии скачивание файлов недоступно — оставляем только копирование кода прогресса.
if (fragment) js = js.replace('<button type="button" class="btn" id="dl">Скачать файлом</button>', '');

const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const body = html.slice(html.indexOf('<!--APP-START-->'), html.indexOf('<!--APP-END-->') + '<!--APP-END-->'.length);

const head = `${title}\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n${fonts}\n<style>\n${css}\n</style>`;
const tail = `<script>\n${js}\n</script>`;

const doc = fragment
  ? `${head}\n${body}\n${tail}\n`
  : `<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n${tail}\n</body>\n</html>\n`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, doc);
console.log(`Готово: ${path.relative(process.cwd(), outPath)} (${(doc.length / 1024).toFixed(0)} КБ)`);

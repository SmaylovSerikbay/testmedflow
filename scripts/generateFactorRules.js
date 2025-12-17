import fs from 'fs';
import path from 'path';

// Простая очистка HTML до текста
function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Генерация ключевых слов из названия фактора
function makeKeywords(title) {
  if (!title) return [];
  const lower = title.toLowerCase();
  const rawWords = lower
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    'и',
    'или',
    'а',
    'в',
    'на',
    'с',
    'со',
    'над',
    'под',
    'из',
    'для',
    'по',
    'при',
    'от',
    'до',
    'их',
    'его',
    'ее',
    'их',
    'производства',
    'соединения',
    'соединенияа',
    'соединенияк',
    'другие',
    'другое',
    'иные',
    'прочие',
    'работы',
    'профессии',
    'факторы',
    'вредные',
    'опасные',
  ]);

  const filtered = rawWords.filter((w) => w.length >= 3 && !stopWords.has(w));
  // Оставляем до 6 ключевых слов, чтобы не раздувать массив
  return Array.from(new Set(filtered)).slice(0, 6);
}

function main() {
  const rootDir = process.cwd();
  const sourcePath = path.join(rootDir, 'таблика факторы.xls');
  if (!fs.existsSync(sourcePath)) {
    console.error('Не найден файл "таблика факторы.xls" в корне проекта');
    process.exit(1);
  }

  const html = fs.readFileSync(sourcePath, 'utf8');

  // Находим все строки таблицы
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = [];
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    rows.push(match[1]);
  }

  const rules = [];

  rows.forEach((rowHtml) => {
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(htmlToText(cellMatch[1]));
    }

    if (cells.length < 4) return;

    const idRaw = cells[0];
    const id = parseInt(idRaw, 10);
    if (!Number.isFinite(id)) return;

    // колонки: 0 — номер, 1–2 — описание, 3 — врачи
    const title = [cells[1], cells[2]].filter(Boolean).join(' ').trim() || cells[1] || cells[2];
    const doctorsRaw = cells[3];

    if (!title || !doctorsRaw) return;

    // Специалистов разделяем по запятым
    const specialties = doctorsRaw
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (specialties.length === 0) return;

    const keywords = makeKeywords(title);

    rules.push({
      id,
      title,
      keywords,
      specialties,
    });
  });

  const outPath = path.join(rootDir, 'factorRules.generated.ts');

  const fileContent =
    `// AUTO-GENERATED FROM "таблика факторы.xls". НЕ РЕДАКТИРУЙТЕ ВРУЧНУЮ.\n` +
    `// Для обновления запустите: node scripts/generateFactorRules.js\n\n` +
    `export const FACTOR_RULES = ${JSON.stringify(rules, null, 2)} as const;\n`;

  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`Сгенерирован файл: ${outPath}, всего правил: ${rules.length}`);
}

main();



// Собранные файлы проверяем разбором обратно: ZIP распаковываем, MOBI
// раскладываем по записям и разжимаем. Иначе «книга собралась» ничего не значит.
import { createRequire } from 'node:module';
import { inflateRawSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const f of ['util', 'zip', 'html', 'epub', 'mobi', 'fb2', 'txt']) {
  require(join(ROOT, 'src', 'lib', `${f}.js`));
}
const FK = globalThis.FK;

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEq(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: ожидалось ${expected}, получено ${actual}`);
}

// ---------- минимальный разбор ZIP ----------
function readZip(buf) {
  const files = new Map();
  let i = 0;
  while (i + 30 <= buf.length) {
    if (buf.readUInt32LE(i) !== 0x04034b50) break;
    const method = buf.readUInt16LE(i + 8);
    const packed = buf.readUInt32LE(i + 18);
    const raw = buf.readUInt32LE(i + 22);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.slice(i + 30, i + 30 + nameLen).toString('utf8');
    const start = i + 30 + nameLen + extraLen;
    const payload = buf.slice(start, start + packed);
    files.set(name, { method, raw, bytes: method === 8 ? inflateRawSync(payload) : payload });
    i = start + packed;
  }
  return files;
}

// ---------- проверка XML на сбалансированность ----------
const VOID_OK = new Set([]);
function assertWellFormed(xml, label) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z_][\w.:-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const [, closing, tag, attrs, selfClose] = m;
    if (xml.startsWith('<?', m.index) || xml.startsWith('<!', m.index)) continue;
    if (selfClose === '/' || VOID_OK.has(tag)) continue;
    if (closing === '/') {
      const top = stack.pop();
      if (top !== tag) throw new Error(`${label}: закрыт <${tag}>, а открыт был <${top}>`);
    } else {
      stack.push(tag);
    }
    if (/=[^"'\s>]/.test(attrs)) throw new Error(`${label}: атрибут без кавычек в <${tag}>`);
  }
  if (stack.length) throw new Error(`${label}: не закрыты теги ${stack.join(', ')}`);

  const bad = xml.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, '');
  if (bad.includes('&')) throw new Error(`${label}: голый & вне сущности`);
}

// ---------- PalmDOC: обратная распаковка ----------
function palmDocDecompress(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b === 0) out.push(0);
    else if (b <= 8) for (let k = 0; k < b; k++) out.push(bytes[i++]);
    else if (b <= 0x7f) out.push(b);
    else if (b <= 0xbf) {
      const v = (b << 8) | bytes[i++];
      const dist = (v >> 3) & 0x7ff;
      const len = (v & 7) + 3;
      const from = out.length - dist;
      for (let k = 0; k < len; k++) out.push(out[from + k]);
    } else {
      out.push(0x20, b ^ 0x80);
    }
  }
  return Buffer.from(out);
}

function readPalmDb(buf) {
  const count = buf.readUInt16BE(76);
  const offsets = [];
  for (let i = 0; i < count; i++) offsets.push(buf.readUInt32BE(78 + i * 8));
  const records = offsets.map((off, i) =>
    buf.slice(off, i + 1 < count ? offsets[i + 1] : buf.length)
  );
  return { count, records, name: buf.slice(0, 32).toString('latin1').replace(/\0+$/, '') };
}

// ---------- тестовая книга ----------
const CH1 = '<p>Первая глава. Дождь шёл третий день подряд, и крыша течёт.</p><p>Кавычки «ёлочки» и тире — тоже текст.</p>';
const CH2 = '<p>Вторая глава с <em>наклонным</em> и <strong>жирным</strong>.</p><p>Amp &amp; lt &lt; gt &gt; уже экранированы.</p>';

function makeBook(n = 2) {
  const chapters = [];
  for (let i = 0; i < n; i++) {
    chapters.push({
      title: `Глава ${i + 1}: «начало»`,
      xhtml: (i % 2 === 0 ? CH1 : CH2).repeat(6),
    });
  }
  return {
    title: 'Тест & проверка <тегов>',
    author: 'Автор Тестовый',
    summaryText: 'Аннотация с «кавычками» и символом &.',
    fandom: 'Ориджинал',
    tags: ['драма', 'AU & прочее'],
    language: 'ru',
    sourceUrl: 'https://example.org/readfic/1',
    siteName: 'Тестовый сайт',
    uuid: '11111111-2222-3333-4444-555555555555',
    chapters,
  };
}

const toBuf = async (blob) => Buffer.from(await blob.arrayBuffer());

// ================= тесты =================

check('util.safeFilename убирает запрещённые символы', () => {
  const name = FK.util.safeFilename('Имя: с/плохими\\символами?*', 'epub');
  assert(!/[\\/:*?"<>|]/.test(name), `осталось запрещённое: ${name}`);
  assert(name.endsWith('.epub'), 'нет расширения');
});

check('util.detectLanguage различает ru и en', () => {
  assertEq(FK.util.detectLanguage('Привет, это русский текст'), 'ru', 'ru');
  assertEq(FK.util.detectLanguage('Hello this is english text'), 'en', 'en');
});

await checkAsync('ограничитель разносит параллельные запросы, а не пускает пачкой', async () => {
  const STEP = 50;
  const limiter = FK.util.createRateLimiter({ interval: STEP });
  const at = [];
  // Именно этот случай ломал прежний throttle: воркеры читали «время прошлого
  // запроса» в одном тике, все видели одно значение и стартовали разом.
  await Promise.all([0, 1, 2, 3, 4].map(async () => {
    await limiter.acquire();
    at.push(Date.now());
  }));
  assertEq(at.length, 5, 'не все слоты выданы');

  // Слоты резервируются по абсолютному времени, поэтому отдельный зазор после
  // «проспавшего» таймера самокомпенсируется — гарантия здесь средний темп.
  const span = at[at.length - 1] - at[0];
  assert(span >= STEP * 4 * 0.9, `пять слотов уложились в ${span} мс вместо ${STEP * 4} — темп не выдержан`);
  for (let i = 1; i < at.length; i++) {
    const gap = at[i] - at[i - 1];
    assert(gap >= STEP * 0.4, `слот ${i} выдан через ${gap} мс — похоже на залп`);
  }
});

check('ограничитель растягивает шаг после 429 и возвращается после серии удач', () => {
  const limiter = FK.util.createRateLimiter({ interval: 100, maxInterval: 800 });
  assertEq(limiter.interval, 100, 'стартовый шаг');
  limiter.penalize(0);
  assertEq(limiter.interval, 200, 'после первого 429 шаг должен удвоиться');
  limiter.penalize(0);
  assertEq(limiter.interval, 400, 'после второго 429');
  for (let i = 0; i < 4; i++) limiter.reward();
  assertEq(limiter.interval, 400, 'четырёх удач мало, чтобы разгоняться');
  limiter.reward();
  assertEq(limiter.interval, 200, 'после пяти удач шаг сокращается');
  for (let i = 0; i < 20; i++) limiter.penalize(0);
  assertEq(limiter.interval, 800, 'шаг не должен уходить выше maxInterval');
});

check('parseRetryAfter понимает и секунды, и HTTP-дату', () => {
  const now = Date.parse('2026-09-15T12:00:00Z');
  assertEq(FK.util.parseRetryAfter('30', now), 30000, 'секунды');
  assertEq(FK.util.parseRetryAfter('  7 ', now), 7000, 'секунды с пробелами');
  assertEq(FK.util.parseRetryAfter('Tue, 15 Sep 2026 12:00:45 GMT', now), 45000, 'HTTP-дата');
  assertEq(FK.util.parseRetryAfter('Tue, 15 Sep 2026 11:59:00 GMT', now), 0, 'дата в прошлом — без ожидания');
  assertEq(FK.util.parseRetryAfter('', now), 0, 'пусто');
  assertEq(FK.util.parseRetryAfter(null, now), 0, 'нет заголовка');
  assertEq(FK.util.parseRetryAfter('скоро', now), 0, 'мусор не ломает разбор');
});

check('backoffDelay растёт с джиттером, уважает Retry-After и потолок', () => {
  const lo = { random: () => 0 };
  const hi = { random: () => 1 };
  assertEq(FK.util.backoffDelay(0, { base: 1000, ...lo }), 500, 'нижняя граница джиттера');
  assertEq(FK.util.backoffDelay(0, { base: 1000, ...hi }), 1000, 'верхняя граница джиттера');
  assertEq(FK.util.backoffDelay(3, { base: 1000, ...hi }), 8000, 'экспонента');
  assertEq(FK.util.backoffDelay(9, { base: 1000, max: 4000, ...hi }), 4000, 'потолок');
  assertEq(FK.util.backoffDelay(0, { base: 1000, floor: 9000, ...hi }), 9000, 'Retry-After как нижняя граница');
  const spread = new Set([0.1, 0.4, 0.9].map((r) => FK.util.backoffDelay(2, { base: 1000, random: () => r })));
  assertEq(spread.size, 3, 'джиттер обязан разносить воркеров');
});

await checkAsync('sleep прерывается по сигналу отмены', async () => {
  const ac = new AbortController();
  const started = Date.now();
  setTimeout(() => ac.abort(), 20);
  let name = '';
  try {
    await FK.util.sleep(5000, ac.signal);
  } catch (err) {
    name = err.name;
  }
  assertEq(name, 'AbortError', 'отмена должна прерывать ожидание');
  assert(Date.now() - started < 1000, 'ожидание не оборвалось — «Отменить» будет выглядеть сломанным');
});

check('palmDoc round-trip на кириллице', () => {
  const text = Buffer.from(('Дождь шёл третий день подряд. ' + CH1).repeat(8), 'utf8');
  const packed = FK.mobi.palmDocCompress(new Uint8Array(text));
  const back = palmDocDecompress(packed);
  assert(back.equals(text), 'распакованное не совпало с исходным');
});

check('palmDoc round-trip на латинице с повторами', () => {
  const text = Buffer.from('abcabcabc '.repeat(200) + 'the quick brown fox '.repeat(50), 'utf8');
  const packed = FK.mobi.palmDocCompress(new Uint8Array(text));
  assert(packed.length < text.length / 2, `сжатие не сработало: ${packed.length} из ${text.length}`);
  assert(palmDocDecompress(packed).equals(text), 'round-trip сломан');
});

check('palmDoc round-trip на случайных байтах', () => {
  const text = Buffer.alloc(3000);
  for (let i = 0; i < text.length; i++) text[i] = (i * 2654435761) & 0xff;
  const packed = FK.mobi.palmDocCompress(new Uint8Array(text));
  assert(palmDocDecompress(packed).equals(text), 'round-trip сломан на бинарных данных');
});

await checkAsync('EPUB: структура и обязательные файлы', async () => {
  const buf = await toBuf(await FK.epub.build(makeBook(3)));
  const files = readZip(buf);

  const first = [...files.keys()][0];
  assertEq(first, 'mimetype', 'mimetype должен быть первым');
  assertEq(files.get('mimetype').method, 0, 'mimetype обязан лежать без сжатия');
  assertEq(files.get('mimetype').bytes.toString(), 'application/epub+zip', 'содержимое mimetype');

  for (const need of ['META-INF/container.xml', 'OEBPS/content.opf', 'OEBPS/nav.xhtml', 'OEBPS/toc.ncx', 'OEBPS/style.css']) {
    assert(files.has(need), `нет файла ${need}`);
  }
  for (let i = 1; i <= 3; i++) {
    assert(files.has(`OEBPS/ch00${i}.xhtml`), `нет главы ${i}`);
  }
});

await checkAsync('EPUB: весь XML корректен и спец-символы экранированы', async () => {
  const buf = await toBuf(await FK.epub.build(makeBook(2)));
  const files = readZip(buf);
  for (const [name, entry] of files) {
    if (!/\.(xhtml|opf|ncx|xml)$/.test(name)) continue;
    assertWellFormed(entry.bytes.toString('utf8'), name);
  }
  const opf = files.get('OEBPS/content.opf').bytes.toString('utf8');
  assert(opf.includes('Тест &amp; проверка &lt;тегов&gt;'), 'заголовок не экранирован в OPF');
  assert(opf.includes('<dc:language>ru</dc:language>'), 'язык не проставлен');
});

await checkAsync('EPUB: оглавление перечисляет все главы', async () => {
  const buf = await toBuf(await FK.epub.build(makeBook(5)));
  const files = readZip(buf);
  const nav = files.get('OEBPS/nav.xhtml').bytes.toString('utf8');
  const ncx = files.get('OEBPS/toc.ncx').bytes.toString('utf8');
  for (let i = 1; i <= 5; i++) {
    assert(nav.includes(`ch00${i}.xhtml`), `nav без главы ${i}`);
    assert(ncx.includes(`ch00${i}.xhtml`), `ncx без главы ${i}`);
  }
  assertEq((ncx.match(/<navPoint/g) || []).length, 6, 'navPoint: 5 глав + титул');
});

await checkAsync('MOBI: PalmDB читается и текст восстанавливается', async () => {
  const book = makeBook(4);
  const buf = await toBuf(FK.mobi.build(book));
  const db = readPalmDb(buf);

  assertEq(buf.slice(60, 68).toString('latin1'), 'BOOKMOBI', 'сигнатура типа/создателя');

  const r0 = db.records[0];
  assertEq(r0.readUInt16BE(0), 2, 'должно быть сжатие PalmDOC');
  const textLength = r0.readUInt32BE(4);
  const textRecordCount = r0.readUInt16BE(8);
  assertEq(r0.readUInt16BE(10), 4096, 'размер записи');
  assertEq(r0.slice(16, 20).toString('latin1'), 'MOBI', 'нет MOBI-заголовка');
  assertEq(r0.readUInt32BE(20), 232, 'длина MOBI-заголовка');
  assertEq(r0.readUInt32BE(28), 65001, 'кодировка должна быть UTF-8');

  const parts = [];
  for (let i = 1; i <= textRecordCount; i++) parts.push(palmDocDecompress(db.records[i]));
  const text = Buffer.concat(parts);
  assertEq(text.length, textLength, 'длина текста разошлась с заголовком');
  assert(text.toString('utf8').includes('Глава 4'), 'последняя глава не попала в текст');
});

await checkAsync('MOBI: EXTH и служебные записи на месте', async () => {
  const buf = await toBuf(FK.mobi.build(makeBook(2)));
  const db = readPalmDb(buf);
  const r0 = db.records[0];

  assertEq(r0.readUInt32BE(16 + 112), 0x40, 'флаг наличия EXTH');
  const exthAt = 16 + 232;
  assertEq(r0.slice(exthAt, exthAt + 4).toString('latin1'), 'EXTH', 'нет EXTH');

  const textRecordCount = r0.readUInt16BE(8);
  assertEq(r0.readUInt16BE(16 + 176), 1, 'первая запись контента');
  assertEq(r0.readUInt16BE(16 + 178), textRecordCount, 'последняя запись контента');

  const flis = db.records[textRecordCount + 1];
  const fcis = db.records[textRecordCount + 2];
  assertEq(flis.slice(0, 4).toString('latin1'), 'FLIS', 'нет FLIS');
  assertEq(fcis.slice(0, 4).toString('latin1'), 'FCIS', 'нет FCIS');
  assertEq(db.records[textRecordCount + 3].toString('hex'), 'e98e0d0a', 'нет метки конца');

  const fullNameOffset = r0.readUInt32BE(16 + 68);
  const fullNameLength = r0.readUInt32BE(16 + 72);
  assertEq(
    r0.slice(fullNameOffset, fullNameOffset + fullNameLength).toString('utf8'),
    'Тест & проверка <тегов>',
    'имя книги в записи 0'
  );
});

check('MOBI: filepos указывает ровно на начало главы', () => {
  const book = makeBook(3);
  const html = FK.mobi.buildHtml(book);
  const bytes = FK.mobi.patchFilepos(html, 3);
  const text = Buffer.from(bytes);
  const str = text.toString('utf8');

  assert(!/FPOS/.test(str), 'остались незаменённые плейсхолдеры');

  const links = [...str.matchAll(/<a filepos=(\d{10})>/g)].map((m) => Number(m[1]));
  assertEq(links.length, 3, 'должно быть три ссылки оглавления');

  links.forEach((offset, i) => {
    const anchor = Buffer.from(`<a name="fkc0000${i + 1}">`, 'utf8');
    assert(offset > 0, `нулевое смещение у главы ${i + 1}`);
    assert(
      text.slice(offset, offset + anchor.length).equals(anchor),
      `filepos главы ${i + 1} указывает мимо якоря`
    );
  });

  const tocPos = Number(str.match(/type="toc"[^>]*filepos=(\d{10})/)[1]);
  const tocAnchor = Buffer.from('<a name="fktoc">', 'utf8');
  assert(text.slice(tocPos, tocPos + tocAnchor.length).equals(tocAnchor), 'guide/toc указывает мимо');
});

check('MOBI: самозакрытых тегов в разметке не остаётся', () => {
  const html = FK.mobi.buildHtml({
    ...makeBook(1),
    chapters: [{ title: 'Глава', xhtml: '<p>Текст<br/>строка</p><hr/><img src="x.jpg" alt=""/>' }],
  });
  assert(!/<br\s*\/>/.test(html), 'остался <br/>');
  assert(!/<hr\s*\/>/.test(html), 'остался <hr/>');
  assert(!/<img[^>]*\/>/.test(html), 'остался самозакрытый <img/>');
});

await checkAsync('FB2: XML корректен, главы на месте', async () => {
  const blob = FK.fb2.build(makeBook(3));
  const xml = (await toBuf(blob)).toString('utf8');
  assertWellFormed(xml, 'fb2');
  assertEq((xml.match(/<section>/g) || []).length, 3, 'секций по числу глав');
  assert(xml.includes('<book-title>Тест &amp; проверка &lt;тегов&gt;</book-title>'), 'заголовок');
  assert(!/<(div|span|em|b|i)[\s>]/.test(xml), 'в FB2 просочились HTML-теги');
  assert(xml.includes('<emphasis>'), 'курсив не переведён в emphasis');
});

await checkAsync('TXT: BOM, заголовки и текст глав', async () => {
  const buf = await toBuf(FK.txt.build(makeBook(2)));
  assertEq(buf.slice(0, 3).toString('hex'), 'efbbbf', 'нет BOM');
  const text = buf.toString('utf8');
  assert(text.includes('Глава 1'), 'нет первой главы');
  assert(text.includes('Глава 2'), 'нет второй главы');
  assert(!/<[a-z]/i.test(text), 'остались теги');
  assert(text.includes('Amp & lt < gt >'), 'сущности не раскрыты');
});

await checkAsync('ZIP: deflate реально сжимает и CRC считается', async () => {
  const payload = 'повторяющийся текст '.repeat(500);
  const blob = await FK.zip([{ name: 'a.txt', data: payload }]);
  const buf = await toBuf(blob);
  const files = readZip(buf);
  assertEq(files.get('a.txt').method, 8, 'должно быть deflate');
  assertEq(files.get('a.txt').bytes.toString('utf8'), payload, 'содержимое не совпало');
  assert(buf.length < Buffer.byteLength(payload) / 3, 'сжатия не произошло');
});

await checkAsync('Книга на 60 глав собирается во все форматы', async () => {
  const book = makeBook(60);
  const epub = await toBuf(await FK.epub.build(book));
  const mobi = await toBuf(FK.mobi.build(book));
  assert(epub.length > 5000, 'подозрительно маленький EPUB');
  assert(mobi.length > 5000, 'подозрительно маленький MOBI');

  const files = readZip(epub);
  assert(files.has('OEBPS/ch060.xhtml'), 'шестидесятая глава потерялась');

  const db = readPalmDb(mobi);
  const r0 = db.records[0];
  const count = r0.readUInt16BE(8);
  const parts = [];
  for (let i = 1; i <= count; i++) parts.push(palmDocDecompress(db.records[i]));
  assertEq(Buffer.concat(parts).length, r0.readUInt32BE(4), 'длина текста разошлась на большой книге');
});

// ---------- упаковка расширения ----------

check('manifest и popup грузят один и тот же набор скриптов', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const fromManifest = manifest.content_scripts[0].js;
  const popup = readFileSync(join(ROOT, 'src', 'popup.js'), 'utf8');
  const block = popup.match(/const SCRIPTS = \[([\s\S]*?)\];/);
  assert(block, 'в popup.js не найден список SCRIPTS');
  const fromPopup = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assertEq(
    fromPopup.join('|'),
    fromManifest.join('|'),
    'списки разошлись — ручной запуск на незнакомом сайте сломается'
  );
  assertEq(fromManifest[fromManifest.length - 1], 'src/content.js', 'content.js должен грузиться последним');
});

check('все файлы из manifest существуют', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const paths = [
    ...manifest.content_scripts[0].js,
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
  ];
  for (const p of paths) {
    assert(existsSync(join(ROOT, p)), `нет файла ${p}`);
  }
});

check('адаптеры из manifest соответствуют доменам в matches', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  const adapterFiles = manifest.content_scripts[0].js
    .filter((p) => p.startsWith('src/adapters/') && !/base|generic/.test(p))
    .map((p) => p.replace('src/adapters/', '').replace('.js', ''));
  const matches = manifest.content_scripts[0].matches.join(' ');
  const domains = {
    ficbook: 'ficbook.net', ao3: 'archiveofourown.org', fanficsme: 'fanfics.me',
    ffnet: 'fanfiction.net', wattpad: 'wattpad.com', royalroad: 'royalroad.com',
  };
  for (const id of adapterFiles) {
    assert(domains[id], `адаптер ${id} не описан в тесте`);
    assert(matches.includes(domains[id]), `${domains[id]} нет в matches — кнопка не появится сама`);
  }
});

console.log(`\nпройдено: ${passed}, провалено: ${failures.length}`);
if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

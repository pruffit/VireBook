// Плавающая панель на странице. Всё внутри shadow DOM: сайты фанфиков любят
// глобальные !important, а виджет должен выглядеть одинаково везде.
//
// Материал — VireGlass, перенесённый в CSS. Шейдерную линзу сюда не взять:
// WebGL не видит DOM и преломлять живую страницу под собой не умеет, а весь
// смысл стекла здесь именно в ней. backdrop-filter это умеет, поэтому причины
// материала выражены им: матовость листа, плотность тела, фаска, кромка.
//
// Плашка живёт в одном из четырёх углов окна и перетаскивается в любой другой:
// под ней текст главы, и место, где она не мешает, знает только читатель.
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  factory(VireBook);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const CSS = `
:host {
  all: initial;
  /* Палитра vire: тёплый почти-чёрный, акцент — не цвет, а подъём поверхности. */
  --vg-body: oklch(0.115 0.006 75);
  --vg-deep: oklch(0.085 0.006 75);
  --vg-ink: oklch(0.93 0.008 83);
  --vg-dim: oklch(0.62 0.009 80);
  /* Светлее токена vire по той же причине, что и legibility: на тёмном теле
     oklch(0.55 …) не читается. Оттенок тот же. */
  --vg-alarm: oklch(0.74 0.16 27);
  --vg-warn: oklch(0.78 0.12 70);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --morph: 0.34s;
  --r-sheet: 26px;
  --pad: 6px;
  --r-item: 20px;
  /* Отступ от края окна. */
  --edge: 18px;
  /* Запас слоя преломления за габарит листа — см. .refract. */
  --slack: 40px;
}
* { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif; }

.root { position: fixed; z-index: 2147483000; }
/* Угол задаётся классами: из прижатого угла панель и растёт. */
.root.x-right { right: var(--edge); }
.root.x-left { left: var(--edge); }
.root.y-bottom { bottom: var(--edge); }
.root.y-top { top: var(--edge); }
/* Бросок в другой угол — доводка того же движения, которым плашку вели. */
.root.gliding { transition: transform 0.38s var(--ease); }
.root.dragging { transition: none; }
.root.dragging, .root.dragging * { cursor: grabbing !important; user-select: none; }
/* Полярность надписи идёт за фоном: над очень светлой страницей тело стекла не
   может уйти достаточно тёмным, и светлый текст на нём нечитаем. */
.root.ink-dark {
  --vg-ink: oklch(0.24 0.012 75);
  --vg-dim: oklch(0.46 0.012 78);
  --vg-alarm: oklch(0.48 0.19 27);
  --vg-warn: oklch(0.52 0.12 62);
}
.fab, .head, .fmt button, .fmt .hint, .label, .link, .err, .note {
  transition: color .42s var(--ease);
}

/* Материал рисует ядро VireGlass в этот канвас: тело, фаска, Френель, блик и
   тень — следствия причин материала, а не набор теней из CSS. Канвас шире
   детали на запас: тень и сбор света уходят наружу формы. */
.glass { position: absolute; pointer-events: none; z-index: 0; }

.shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--r-sheet);
  /* Плашку водят пальцем — браузер не должен вместо этого скроллить страницу,
     а протяжка по ней не должна выделять её же подписи. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.shell.ready {
  transition:
    width var(--morph) var(--ease),
    height var(--morph) var(--ease),
    border-radius var(--morph) var(--ease);
}

/* Преломление живого DOM. Слой ШИРЕ листа и лежит внутри оболочки, а не на ней
   самой, по двум причинам сразу:
     запас — у гаусса и смещения под кромкой должно быть что собирать, иначе
             край тянет пустоту за областью фильтра;
     клип  — с запасом backdrop-filter выплёскивает отфильтрованный фон за
             границы своего элемента, и мимо скруглённой формы виден
             прямоугольник. Здесь выплеск срезает overflow.
   Отдельный .clip не украшение: пока backdrop-filter лежит прямо в оболочке,
   её высота едет морфингом, а лист прижат ВЕРХОМ, Chromium перестаёт
   пересчитывать положение соседних слоёв — содержимое панели так и остаётся
   поднятым на десяток-другой пикселей и вылезает за клип. Своя обёртка с
   overflow это развязывает. */
.clip {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.refract { position: absolute; inset: calc(var(--slack) * -1); }
/* Тело — ПОВЕРХ преломления. Будь оно фоном оболочки, преломление затянуло бы
   его в себя: фон родителя входит в задник его же ребёнка. */
.tint { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

/* Запасной материал, когда WebGL2 недоступен: расширение обязано работать и без стекла. */
.shell.flat {
  background: color-mix(in oklch, var(--vg-body) 90%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--vg-ink) 22%, transparent),
    0 0 0 1px color-mix(in oklch, var(--vg-ink) 10%, transparent),
    0 20px 44px -16px color-mix(in oklch, var(--vg-deep) 85%, transparent);
}

.view {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transition: opacity .19s var(--ease);
}
/* Содержимое приколото к тому же углу, из которого растёт лист: иначе во время
   морфинга оно уезжает от края. */
.root.x-right .view { right: 0; }
.root.x-left .view { left: 0; }
.root.y-bottom .view { bottom: 0; }
.root.y-top .view { top: 0; }
.view.in { opacity: 1; }

.fab {
  display: flex; align-items: center; gap: 9px;
  padding: 13px 17px 13px 15px;
  background: transparent; border: 0; cursor: pointer;
  color: var(--vg-ink); font-size: 14px; font-weight: 600; white-space: nowrap;
}
.fab svg { display: block; }

.panel { width: 260px; padding: var(--pad); }
.head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 9px; font-size: 12px; letter-spacing: .02em; color: var(--vg-dim);
  cursor: grab;
}
.head .site { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.head .grip { flex: none; margin-left: auto; opacity: .55; }
.fmt { display: flex; flex-direction: column; }
/* Концентрично: радиус листа 20 = радиус пункта 14 + отступ 6. */
.fmt button {
  display: flex; align-items: baseline; gap: 8px; width: 100%;
  background: transparent; border: 0; cursor: pointer; text-align: left;
  padding: 10px; border-radius: var(--r-item);
  color: var(--vg-ink); font-size: 14px;
  transition: background .13s var(--ease);
}
.fmt button:hover, .fmt button:focus-visible {
  background: color-mix(in oklch, var(--vg-ink) 9%, transparent);
  outline: none;
}
.fmt .hint { color: var(--vg-dim); font-size: 11.5px; }

.pad { width: 260px; padding: 13px 14px 14px; }
.label { font-size: 13px; color: var(--vg-ink); margin-bottom: 10px; min-height: 17px; }
.bar { height: 4px; border-radius: 99px; overflow: hidden; background: color-mix(in oklch, var(--vg-ink) 10%, transparent); }
.bar > i { display: block; height: 100%; width: 0%; border-radius: 99px; background: var(--vg-ink); transition: width .3s var(--ease); }
.row { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; }
.link {
  background: none; border: 0; cursor: pointer; padding: 3px 0;
  color: var(--vg-dim); font-size: 12px;
  transition: color .13s var(--ease);
}
.link:hover, .link:focus-visible { color: var(--vg-ink); outline: none; }
.err { color: var(--vg-alarm); font-size: 12.5px; line-height: 1.45; }
.note { display: block; margin-top: 7px; color: var(--vg-warn); font-size: 12px; }
.ok { color: var(--vg-ink); }

@media (prefers-reduced-motion: reduce) {
  .shell.ready { transition: none; }
  .view { transition: none; }
  .root.gliding { transition: none; }
}
`;

  const ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.8v8.4M4.6 7l3.4 3.4L11.4 7M2.2 13.4h11.6"/></svg>';
  const GRIP = '<svg class="grip" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="3" cy="2.5" r="1"/><circle cx="9" cy="2.5" r="1"/><circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="3" cy="9.5" r="1"/><circle cx="9" cy="9.5" r="1"/></svg>';

  const FORMATS = [
    { id: 'epub', label: 'EPUB', hint: 'для Send to Kindle' },
    { id: 'mobi', label: 'MOBI', hint: 'на Kindle по кабелю' },
    { id: 'fb2', label: 'FB2', hint: 'телефон, PocketBook' },
    { id: 'txt', label: 'TXT', hint: 'просто текст' },
  ];

  /** Углы окна: первая буква — верх/низ, вторая — лево/право. */
  const CORNERS = ['br', 'bl', 'tr', 'tl'];
  /** Сколько нужно увести палец, чтобы это считалось переносом, а не нажатием. */
  const DRAG_START = 7;
  /** Плашка не уезжает за край окна: столько её краю остаётся до границы. */
  const KEEP_IN = 8;

  function normalizeCorner(value) {
    return CORNERS.indexOf(value) >= 0 ? value : 'br';
  }

  function create({ siteName, defaultFormat, corner, onCornerChange, onDownload }) {
    const host = document.createElement('div');
    host.id = 'virebook-root';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;

    const rootEl = document.createElement('div');
    rootEl.className = 'root';
    const canvas = document.createElement('canvas');
    canvas.className = 'glass';
    const shell = document.createElement('div');
    shell.className = 'shell';
    const clipEl = document.createElement('div');
    clipEl.className = 'clip';
    const refractEl = document.createElement('div');
    refractEl.className = 'refract';
    clipEl.append(refractEl);
    const tintEl = document.createElement('div');
    tintEl.className = 'tint';
    shell.append(clipEl, tintEl);
    rootEl.append(canvas, shell);

    // Фильтр преломления живёт в теневом дереве: url(#…) в backdrop-filter
    // резолвится внутри него, и страница о нём ничего не знает.
    const SVGNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const filterEl = document.createElementNS(SVGNS, 'filter');
    filterEl.setAttribute('id', 'vg-refract');
    // sRGB обязателен. По умолчанию SVG считает фильтр в linearRGB, и тогда
    // нейтральная середина карты (128) приезжает в шейдер как 55 — а это сдвиг
    // на треть шкалы, то есть ВЕСЬ задник под плашкой уезжает по диагонали на
    // ~9 px и у кромки затягивает то, что лежит снаружи. Тот же linearRGB
    // высветляет рассеяние: над тёмной страницей плашка светилась.
    filterEl.setAttribute('color-interpolation-filters', 'sRGB');
    // Область — ровно по боксу СЛОЯ преломления, а он шире листа на --slack.
    // Запас нужен гауссу и смещению, а прямоугольный выплеск за форму срезает
    // клип оболочки (см. .refract в CSS).
    filterEl.setAttribute('filterUnits', 'objectBoundingBox');
    filterEl.setAttribute('x', '0');
    filterEl.setAttribute('y', '0');
    filterEl.setAttribute('width', '1');
    filterEl.setAttribute('height', '1');
    // Нейтральная заливка под картой: там, где карты нет, канал равен нулю, а это
    // сдвиг на половину шкалы — запас области поехал бы целиком.
    const flood = document.createElementNS(SVGNS, 'feFlood');
    flood.setAttribute('flood-color', 'rgb(128,128,128)');
    flood.setAttribute('result', 'flat');
    const feImage = document.createElementNS(SVGNS, 'feImage');
    feImage.setAttribute('result', 'shape');
    feImage.setAttribute('preserveAspectRatio', 'none');
    const merge = document.createElementNS(SVGNS, 'feMerge');
    merge.setAttribute('result', 'map');
    for (const src of ['flat', 'shape']) {
      const node = document.createElementNS(SVGNS, 'feMergeNode');
      node.setAttribute('in', src);
      merge.append(node);
    }
    // Рассеяние ПЕРВЫМ, смещение вторым: у матового стекла свет рассеивается в теле,
    // и преломлять после этого нечего резкого. В обратном порядке кромка затягивает
    // под деталь ещё чёткий текст страницы — он читается грязными пятнами.
    const blurEl = document.createElementNS(SVGNS, 'feGaussianBlur');
    blurEl.setAttribute('in', 'SourceGraphic');
    blurEl.setAttribute('stdDeviation', '0');
    blurEl.setAttribute('result', 'scattered');
    const feDisp = document.createElementNS(SVGNS, 'feDisplacementMap');
    feDisp.setAttribute('in', 'scattered');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    filterEl.append(flood, feImage, merge, blurEl, feDisp);
    svg.append(filterEl);
    shadow.append(style, svg, rootEl);

    /** Запас слоя преломления, тот же, что в токене --slack. */
    const SLACK = 40;
    // Габарит самой крупной формы: канвас ставится под неё один раз и дальше не
    // пересоздаётся — во время морфинга размер меняется каждый кадр.
    const MAX_W = 280;
    const MAX_H = 240;
    let glass = null;
    try {
      if (typeof VireBookGlass !== 'undefined') {
        glass = VireBookGlass.createGlassSurface(canvas, MAX_W, MAX_H);
      }
    } catch {
      glass = null;
    }
    if (!glass) {
      canvas.remove();
      clipEl.remove();
      tintEl.remove();
      shell.classList.add('flat');
    }
    if (glass) window.__VIREBOOK_GLASS__ = glass;

    let at = normalizeCorner(corner);

    /** Канвас прижат к тому же углу, что и сам виджет: деталь в нём переезжает,
     *  а он остаётся на месте — resize пересоздаёт текстуры. */
    function placeCanvas() {
      if (!glass) return;
      const off = -glass.pad + 'px';
      canvas.style.left = at[1] === 'l' ? off : '';
      canvas.style.right = at[1] === 'r' ? off : '';
      canvas.style.top = at[0] === 't' ? off : '';
      canvas.style.bottom = at[0] === 'b' ? off : '';
    }

    function applyCorner() {
      rootEl.classList.toggle('x-right', at[1] === 'r');
      rootEl.classList.toggle('x-left', at[1] === 'l');
      rootEl.classList.toggle('y-bottom', at[0] === 'b');
      rootEl.classList.toggle('y-top', at[0] === 't');
      placeCanvas();
      // Канвас переехал сразу, а деталь в нём — только со следующим кадром:
      // без этого одного кадра тень и фаска видны сдвинутыми от листа.
      if (glass && shell.offsetWidth) {
        glass.draw(
          shell.offsetWidth,
          shell.offsetHeight,
          parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0,
          at
        );
      }
    }
    applyCorner();

    /** Материал разводит свою светлоту со светлотой фона, поэтому ему нужен цвет
     *  страницы под виджетом, а не «чёрное по умолчанию». */
    function pageBackdrop() {
      for (const el of [document.body, document.documentElement]) {
        if (!el) continue;
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg)) return bg;
      }
      return '#ffffff';
    }

    let painting = 0;
    let paintUntil = 0;
    let lastSpread = -1;
    /** Радиус листа — тот же, что в токене --r-sheet. */
    const SHEET_RADIUS = 26;
    /** Форма едет transition'ом, отклик на курсор — пружинами ядра. И то и другое
     *  покадрово, поэтому цикл один: идёт до срока и пока деталь не успокоится. */
    function paintGlass(until) {
      if (!glass) return;
      // Срок только отодвигается: короткий вызов посреди длинного не должен
      // обрывать уже начатую доводку.
      paintUntil = Math.max(paintUntil, until || performance.now());
      if (painting) return;
      const frame = () => {
        painting = 0;
        const w = shell.offsetWidth;
        const h = shell.offsetHeight;
        if (w && h) {
          const r = parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0;
          const out = glass.draw(w, h, r, at);
          rootEl.classList.toggle('ink-dark', !out.inkLight);
          tintEl.style.background = out.body;
          // Карта — растр под целевую форму, но лист во время морфинга ещё едет.
          // Тянем её за живым габаритом: поле гладкое, растяжение незаметно, зато
          // фаска всё время приклеена к настоящей кромке.
          fitMap(w, h);
        }
        if (performance.now() < paintUntil || !glass.idle() || !glass.settled()) {
          painting = requestAnimationFrame(frame);
        } else if (w && h) {
          // Карта смещений — растр: строим её на устоявшейся форме, а не каждый кадр.
          refract(w, h, parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0);
          // Пестрота считается обходом точек — тоже по устоявшейся форме. Перерисовка
          // только если она заметно изменилась, иначе цикл сам себя будит.
          const next = pageSpread();
          if (Math.abs(next - lastSpread) > 0.05) {
            lastSpread = next;
            glass.setSpread(next);
            paintGlass(performance.now() + 500);
          }
        }
      };
      painting = requestAnimationFrame(frame);
    }

    /**
     * Пестрота фона под деталью. Зонд ядра снимает её с нарисованной сцены, но сцены
     * у нас нет — линза выключена. Оцениваем по DOM: доля точек под панелью, где лежит
     * не пустое место, а содержимое. Над ровным фоном плотность не нужна, над текстом —
     * нужна, и решает это модель, а не мы.
     */
    function pageSpread(rect) {
      const box = rect || shell.getBoundingClientRect();
      if (!box.width || !box.height) return 0;
      const cols = 5;
      const rows = 4;
      let hits = 0;
      let total = 0;
      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const x = box.left + (box.width * (i + 0.5)) / cols;
          const y = box.top + (box.height * (j + 0.5)) / rows;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          total += 1;
          const stack = document.elementsFromPoint(x, y);
          for (const el of stack) {
            if (el === host || el === document.documentElement || el === document.body) continue;
            // Картинка или непустой текст — то, что модель и называет пестротой.
            const tag = el.tagName;
            if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'SVG') {
              hits += 1;
              break;
            }
            if ((el.textContent || '').trim()) {
              hits += 1;
              break;
            }
          }
        }
      }
      return total ? hits / total : 0;
    }

    /** Зонду ядра нужен цвет фона: от него зависят плотность тела и полярность надписи. */
    function refreshBackdrop() {
      if (!glass) return;
      glass.setBackdropColor(pageBackdrop());
      lastSpread = pageSpread();
      glass.setSpread(lastSpread);
      paintGlass(performance.now() + 900);
    }

    let mapFor = '';
    // Построение карты — это цикл по пикселям плюс кодирование PNG, и оно
    // синхронное. Формы у виджета наперечёт, поэтому считаем каждую один раз.
    const mapCache = new Map();
    /** Карта лежит в системе координат слоя преломления, а он шире листа на запас:
     *  сам лист начинается на SLACK от его угла. */
    function fitMap(w, h) {
      feImage.setAttribute('x', String(SLACK));
      feImage.setAttribute('y', String(SLACK));
      feImage.setAttribute('width', String(w));
      feImage.setAttribute('height', String(h));
    }
    /** Преломление живого DOM: карту и величину сдвига считает ядро, применяет
     *  backdrop-filter. Пересчёт только на смену формы — это растр. */
    function refract(w, h, r) {
      if (!glass) return;
      const key = w + 'x' + h + 'r' + Math.round(r);
      if (key === mapFor) return;
      mapFor = key;
      let out = mapCache.get(key);
      if (!out) {
        out = glass.refraction(w, h, r);
        // Форм у виджета единицы, но у страницы бывает свой зум и своя ширина:
        // кэш не должен расти без края.
        if (mapCache.size > 24) mapCache.clear();
        mapCache.set(key, out);
      }
      if (!out.map) return;
      feImage.setAttribute('href', out.map);
      fitMap(w, h);
      feDisp.setAttribute('scale', out.scale.toFixed(2));
      blurEl.setAttribute('stdDeviation', (out.blur / 2).toFixed(2));
      refractEl.style.backdropFilter = 'url(#vg-refract)';
      refractEl.style.webkitBackdropFilter = 'url(#vg-refract)';
    }

    let controller = null;
    let settled = true;
    let view = null;
    let mode = 'idle';

    /** Габарит меряем на клоне: панель должна въехать сразу в конечной ширине,
     *  иначе текст переверстается по ходу морфинга. */
    function measure(el) {
      const probe = el.cloneNode(true);
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      probe.style.top = '0';
      probe.style.opacity = '0';
      probe.style.transition = 'none';
      rootEl.append(probe);
      const size = { w: probe.offsetWidth, h: probe.offsetHeight };
      probe.remove();
      return size;
    }

    // ── Перенос плашки ───────────────────────────────────────────────────────
    // Под виджетом лежит текст главы, и какой угол свободен — знает только
    // читатель. Плашку ведут пальцем и отпускают: она уходит в ближайший угол.

    /** Ближайший угол — по тому, в какой четверти окна оказалась середина листа. */
    function nearestCorner(box) {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      return (cy < innerHeight / 2 ? 't' : 'b') + (cx < innerWidth / 2 ? 'l' : 'r');
    }

    /** Переезд в угол. Лист уже нарисован там, где его отпустили, поэтому сначала
     *  меняем угол, а потом сдвигом возвращаем его на прежнее место и отпускаем
     *  сдвиг: иначе он телепортируется. */
    function moveTo(next, animate) {
      const target = normalizeCorner(next);
      const before = shell.getBoundingClientRect();
      at = target;
      applyCorner();
      rootEl.classList.remove('gliding');
      rootEl.style.transform = '';
      const after = shell.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (animate && (dx || dy)) {
        rootEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        requestAnimationFrame(() => {
          rootEl.classList.add('gliding');
          rootEl.style.transform = '';
        });
      }
      if (onCornerChange) onCornerChange(at);
      // Под новым углом другой фон: и плотность тела, и полярность надписи.
      refreshBackdrop();
    }

    /** Соседний угол в заданную сторону; если в эту сторону ехать некуда — остаёмся. */
    function step(dir) {
      const y = at[0];
      const x = at[1];
      if (dir === 'left') return moveTo(y + 'l', true);
      if (dir === 'right') return moveTo(y + 'r', true);
      if (dir === 'up') return moveTo('t' + x, true);
      return moveTo('b' + x, true);
    }

    let drag = null;
    let dragged = false;

    shell.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      // Прошлый бросок мог закончиться без клика — флаг не должен дожить до
      // следующего нажатия и съесть его.
      dragged = false;
      const box = shell.getBoundingClientRect();
      drag = { x: e.clientX, y: e.clientY, box, moving: false };
      if (glass) {
        glass.grab(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2));
        paintGlass();
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moving) {
        if (Math.hypot(dx, dy) < DRAG_START) {
          // Ещё нажатие, а не перенос: стекло тянется за пальцем, но не едет.
          if (glass) glass.drag(dx, dy);
          return;
        }
        drag.moving = true;
        dragged = true;
        rootEl.classList.remove('gliding');
        rootEl.classList.add('dragging');
        // Плашка оторвалась от пальца как орган управления и поехала как
        // предмет — деформацию на это время отпускаем.
        if (glass) glass.release();
      }
      const b = drag.box;
      const mx = Math.min(Math.max(dx, KEEP_IN - b.left), innerWidth - KEEP_IN - b.right);
      const my = Math.min(Math.max(dy, KEEP_IN - b.top), innerHeight - KEEP_IN - b.bottom);
      rootEl.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      if (glass) paintGlass();
    });

    const letGo = () => {
      if (!drag) return;
      const moving = drag.moving;
      drag = null;
      if (glass) glass.release();
      if (moving) {
        rootEl.classList.remove('dragging');
        moveTo(nearestCorner(shell.getBoundingClientRect()), true);
      } else if (glass) {
        paintGlass();
      }
    };
    window.addEventListener('pointerup', letGo);
    window.addEventListener('pointercancel', letGo);

    // Отпустили после переноса — это не нажатие: иначе бросок плашки открывал
    // бы меню, а бросок из меню начинал бы скачивание.
    rootEl.addEventListener(
      'click',
      (e) => {
        if (!dragged) return;
        dragged = false;
        e.stopPropagation();
        e.preventDefault();
      },
      true
    );

    // Alt+стрелки — то же самое с клавиатуры. Простые стрелки заняты списком
    // форматов, и отнимать их у него нельзя.
    rootEl.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
      if (!dir) return;
      e.preventDefault();
      step(dir);
    });

    // Материал снимает фон только когда рисует, а рисует он во время морфинга.
    // Смена темы или размера окна меняет фон под деталью вне этих окон.
    if (glass) {
      let idleTimer = 0;
      const restage = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(refreshBackdrop, 180);
      };
      window.addEventListener('resize', restage, { passive: true });
      window.addEventListener('scroll', restage, { passive: true });
      try {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', restage);
      } catch {
        /* старый Safari-стиль API — не критично, виджет живёт в Chromium */
      }
    }

    // Панель закрывается кликом мимо и Escape. Во время скачивания не закрываем:
    // случайный клик по странице не должен отменять начатую работу.
    const closable = () => mode === 'menu' || mode === 'result';
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (!closable()) return;
        if (e.composedPath && e.composedPath().includes(host)) return;
        renderIdle();
      },
      true
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && closable()) renderIdle(true);
    });

    let mountTries = 0;
    /** create() зовут до вставки в документ, а габарит меряется только в
     *  разложенном дереве: до вставки он нулевой и панель схлопывается.
     *  Ждём таймером, а не кадром: во вкладке, открытой в фоне, кадров нет
     *  вовсе — по rAF виджет не появлялся бы до первого показа. */
    function firstRender() {
      if (host.isConnected) {
        renderIdle();
        refreshBackdrop();
        return;
      }
      if (mountTries++ < 120) setTimeout(firstRender, 32);
    }

    /** Морфинг: форма одна и та же, она меняет габарит и радиус, а содержимое
     *  сменяется перекрёстным затуханием внутри неё. */
    function setView(next, pill) {
      const { w, h } = measure(next);
      next.classList.add('view');
      next.style.width = w + 'px';

      const previous = view;
      if (previous) {
        previous.classList.remove('in');
        setTimeout(() => previous.remove(), 220);
      }
      shell.append(next);
      view = next;

      // Материал считаем по ЦЕЛЕВОМУ габариту до начала морфинга: иначе панель
      // въезжает с плотностью и картой от прежней формы и доводится до вида уже
      // после — это и читается как «сначала не то, потом дёрнулось».
      if (glass) {
        const now = shell.getBoundingClientRect();
        // Лист растёт из прижатого угла — от него и считаем целевой прямоугольник.
        const left = at[1] === 'l' ? now.left : (now.right || innerWidth - 18) - w;
        const top = at[0] === 't' ? now.top : (now.bottom || innerHeight - 18) - h;
        lastSpread = pageSpread({ left, top, width: w, height: h });
        glass.setSpread(lastSpread);
        refract(w, h, pill ? h / 2 : SHEET_RADIUS);
      }

      const apply = () => {
        shell.style.width = w + 'px';
        shell.style.height = h + 'px';
        shell.style.borderRadius = pill ? h / 2 + 'px' : '';
        next.classList.add('in');
        paintGlass(performance.now() + 460);
      };

      if (!shell.classList.contains('ready')) {
        apply();
        requestAnimationFrame(() => shell.classList.add('ready'));
      } else {
        requestAnimationFrame(apply);
      }
      return next;
    }

    function renderIdle(focus) {
      settled = true;
      mode = 'idle';
      const fab = document.createElement('button');
      fab.className = 'fab';
      fab.type = 'button';
      fab.title = 'Скачать книгу. Перетащить — в любой угол, Alt+стрелки — то же с клавиатуры';
      fab.setAttribute('aria-haspopup', 'menu');
      fab.setAttribute('aria-expanded', 'false');
      fab.innerHTML = ICON + '<span>Скачать книгу</span>';
      fab.addEventListener('click', () => renderMenu());
      setView(fab, true);
      // Возврат по Escape не должен терять фокус посреди страницы.
      if (focus) fab.focus();
    }

    function renderMenu() {
      settled = false;
      mode = 'menu';
      const panel = document.createElement('div');
      panel.className = 'panel';
      const head = document.createElement('div');
      head.className = 'head';
      head.title = 'Потянуть — перенести плашку в другой угол';
      const site = document.createElement('span');
      site.className = 'site';
      site.textContent = siteName;
      head.append(site);
      head.insertAdjacentHTML('beforeend', GRIP);
      const list = document.createElement('div');
      list.className = 'fmt';
      list.setAttribute('role', 'menu');

      const ordered = FORMATS.slice().sort((a, b) => {
        if (a.id === defaultFormat) return -1;
        if (b.id === defaultFormat) return 1;
        return 0;
      });
      for (const f of ordered) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'menuitem');
        b.innerHTML = '<span>' + f.label + '</span><span class="hint">' + f.hint + '</span>';
        b.addEventListener('click', () => start(f.id));
        list.append(b);
      }
      // Список — меню: стрелки ходят по пунктам, а не скроллят страницу под ним.
      list.addEventListener('keydown', (e) => {
        if (e.altKey) return;
        const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        const items = [...list.querySelectorAll('button')];
        const i = items.indexOf(shadow.activeElement);
        items[(i + delta + items.length) % items.length].focus();
      });
      panel.append(head, list);
      setView(panel, false);
      const first = list.querySelector('button');
      if (first) first.focus();
    }

    function renderProgress() {
      settled = false;
      mode = 'progress';
      const wrap = document.createElement('div');
      wrap.className = 'pad';
      const label = document.createElement('div');
      label.className = 'label';
      label.setAttribute('role', 'status');
      label.textContent = 'Начинаю…';
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('i');
      bar.append(fill);
      const row = document.createElement('div');
      row.className = 'row';
      const cancel = document.createElement('button');
      cancel.className = 'link';
      cancel.type = 'button';
      cancel.textContent = 'Отменить';
      cancel.addEventListener('click', () => {
        if (controller) controller.abort();
        renderIdle(true);
      });
      row.append(cancel);
      wrap.append(label, bar, row);
      setView(wrap, false);
      return { label, fill };
    }

    function renderResult({ error, filename, note }) {
      settled = true;
      mode = 'result';
      const wrap = document.createElement('div');
      wrap.className = 'pad';
      const msg = document.createElement('div');
      msg.className = error ? 'err' : 'label ok';
      msg.setAttribute('role', 'status');
      msg.textContent = error ? 'Не получилось: ' + error : 'Готово: ' + filename;
      if (!error && note) {
        const warn = document.createElement('span');
        warn.className = 'note';
        warn.textContent = note;
        msg.append(warn);
      }
      const row = document.createElement('div');
      row.className = 'row';
      const again = document.createElement('button');
      again.className = 'link';
      again.type = 'button';
      again.textContent = error ? 'Попробовать другой формат' : 'Скачать ещё';
      again.addEventListener('click', () => renderMenu());
      row.append(again);
      wrap.append(msg, row);
      setView(wrap, false);
      // Предупреждение о неполной книге не прячем: его должны увидеть.
      if (!error && !note) setTimeout(() => { if (settled) renderIdle(); }, 6000);
    }

    async function start(format) {
      const ui = renderProgress();
      controller = new AbortController();
      const progress = (text, pct) => {
        ui.label.textContent = text;
        if (typeof pct === 'number') {
          ui.fill.style.width = Math.min(99, Math.max(2, pct)) + '%';
        }
      };
      try {
        const result = await onDownload({ format, progress, signal: controller.signal });
        ui.fill.style.width = '100%';
        renderResult({ filename: result.filename, note: result.note });
      } catch (err) {
        if (controller && controller.signal.aborted) return;
        renderResult({ error: err && err.message ? err.message : String(err) });
      } finally {
        controller = null;
      }
    }

    firstRender();
    return { host, renderMenu, start, moveTo: (next) => moveTo(next, true), corner: () => at };
  }

  VireBook.ui = { create, FORMATS, CORNERS };
  return VireBook;
});

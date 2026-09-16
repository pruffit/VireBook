// Плавающая панель на странице. Всё внутри shadow DOM: сайты фанфиков любят
// глобальные !important, а виджет должен выглядеть одинаково везде.
//
// Материал — VireGlass, перенесённый в CSS. Шейдерную линзу сюда не взять:
// WebGL не видит DOM и преломлять живую страницу под собой не умеет, а весь
// смысл стекла здесь именно в ней. backdrop-filter это умеет, поэтому причины
// материала выражены им: матовость листа, плотность тела, фаска, кромка.
(function (root, factory) {
  const FK = (root.FK = root.FK || {});
  factory(FK);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (FK) {
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
}
* { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif; }

.root { position: fixed; right: 18px; bottom: 18px; z-index: 2147483000; }
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
}
.shell.ready {
  transition:
    width var(--morph) var(--ease),
    height var(--morph) var(--ease),
    border-radius var(--morph) var(--ease);
}
/* Своего фона у оболочки нет: страницу под деталью показывает линза, преломляя
   снимок вкладки. Здесь только клип содержимого по форме. */
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
  position: absolute; right: 0; bottom: 0;
  opacity: 0;
  transition: opacity .19s var(--ease);
}
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
  padding: 8px 10px 9px; font-size: 12px; letter-spacing: .02em; color: var(--vg-dim);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
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
}
`;

  const ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.8v8.4M4.6 7l3.4 3.4L11.4 7M2.2 13.4h11.6"/></svg>';

  const FORMATS = [
    { id: 'epub', label: 'EPUB', hint: 'для Send to Kindle' },
    { id: 'mobi', label: 'MOBI', hint: 'на Kindle по кабелю' },
    { id: 'fb2', label: 'FB2', hint: 'телефон, PocketBook' },
    { id: 'txt', label: 'TXT', hint: 'просто текст' },
  ];

  function create({ siteName, defaultFormat, onDownload }) {
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
    // Область с запасом: ровно по боксу примитивы за краем не рисуются, и по периметру
    // остаётся полоса нетронутого фона — видно как кусок без преломления.
    filterEl.setAttribute('filterUnits', 'objectBoundingBox');
    filterEl.setAttribute('x', '-0.25');
    filterEl.setAttribute('y', '-0.25');
    filterEl.setAttribute('width', '1.5');
    filterEl.setAttribute('height', '1.5');
    // Нейтральная заливка под картой: там, где карты нет, канал равен нулю, а это
    // сдвиг на половину шкалы — запас области поехал бы целиком.
    const flood = document.createElementNS(SVGNS, 'feFlood');
    flood.setAttribute('flood-color', 'rgb(128,128,128)');
    flood.setAttribute('result', 'flat');
    const feImage = document.createElementNS(SVGNS, 'feImage');
    feImage.setAttribute('result', 'shape');
    feImage.setAttribute('preserveAspectRatio', 'none');
    feImage.setAttribute('x', '0');
    feImage.setAttribute('y', '0');
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

    // Габарит самой крупной формы: канвас ставится под неё один раз и дальше не
    // пересоздаётся — во время морфинга размер меняется каждый кадр.
    const MAX_W = 280;
    const MAX_H = 240;
    let glass = null;
    try {
      if (typeof FKGlass !== 'undefined') {
        glass = FKGlass.createGlassSurface(canvas, MAX_W, MAX_H);
        canvas.style.right = -glass.pad + 'px';
        canvas.style.bottom = -glass.pad + 'px';
      }
    } catch {
      glass = null;
    }
    if (!glass) {
      canvas.remove();
      shell.classList.add('flat');
    }
    if (glass) window.__FK_GLASS__ = glass;

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
    let lastSpread = -1;
    /** Радиус листа — тот же, что в токене --r-sheet. */
    const SHEET_RADIUS = 26;
    /** Форма едет transition'ом, отклик на курсор — пружинами ядра. И то и другое
     *  покадрово, поэтому цикл один: идёт до срока и пока деталь не успокоится. */
    function paintGlass(until) {
      if (!glass) return;
      const deadline = until || performance.now();
      const frame = () => {
        const w = shell.offsetWidth;
        const h = shell.offsetHeight;
        if (w && h) {
          const r = parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0;
          const out = glass.draw(w, h, r);
          rootEl.classList.toggle('ink-dark', !out.inkLight);
          shell.style.background = out.body;
        }
        if (performance.now() < deadline || !glass.idle() || !glass.settled()) {
          painting = requestAnimationFrame(frame);
        } else {
          painting = 0;
          if (w && h) {
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
        }
      };
      if (painting) cancelAnimationFrame(painting);
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
      glass.setSpread(pageSpread());
      paintGlass(performance.now() + 900);
    }

    let mapFor = '';
    // Построение карты — это цикл по пикселям плюс кодирование PNG, и оно
    // синхронное. Формы у виджета наперечёт, поэтому считаем каждую один раз.
    const mapCache = new Map();
    /** Преломление живого DOM: карту и величину сдвига считает ядро, применяет
     *  backdrop-filter. Пересчёт только на смену формы — это растр. */
    function refract(w, h, r) {
      if (!glass || !filterEl) return;
      const key = w + 'x' + h + 'r' + Math.round(r);
      if (key === mapFor) return;
      mapFor = key;
      let out = mapCache.get(key);
      if (!out) {
        out = glass.refraction(w, h, r);
        mapCache.set(key, out);
      }
      if (!out.map) return;
      feImage.setAttribute('href', out.map);
      feImage.setAttribute('width', String(w));
      feImage.setAttribute('height', String(h));
      feDisp.setAttribute('scale', out.scale.toFixed(2));
      blurEl.setAttribute('stdDeviation', (out.blur / 2).toFixed(2));
      shell.style.backdropFilter = 'url(#vg-refract)';
      shell.style.webkitBackdropFilter = 'url(#vg-refract)';
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

      // Деформация — часть материала: пружины считает ядро, отсюда только жест.
      let from = null;
      shell.addEventListener('pointerdown', (e) => {
        const box = shell.getBoundingClientRect();
        glass.grab(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2));
        from = { x: e.clientX, y: e.clientY };
        paintGlass();
      });
      window.addEventListener('pointermove', (e) => {
        if (!from) return;
        glass.drag(e.clientX - from.x, e.clientY - from.y);
      });
      const letGo = () => {
        if (!from) return;
        from = null;
        glass.release();
        paintGlass();
      };
      window.addEventListener('pointerup', letGo);
      window.addEventListener('pointercancel', letGo);
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
      if (e.key === 'Escape' && closable()) renderIdle();
    });

    let mountFrames = 0;
    /** create() зовут до вставки в документ, а габарит меряется только в
     *  разложенном дереве: до вставки он нулевой и панель схлопывается. */
    function firstRender() {
      if (host.isConnected) {
        renderIdle();
        refreshBackdrop();
        return;
      }
      if (mountFrames++ < 240) requestAnimationFrame(firstRender);
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
        const right = now.right || window.innerWidth - 18;
        const bottom = now.bottom || window.innerHeight - 18;
        const target = { left: right - w, top: bottom - h, width: w, height: h };
        lastSpread = pageSpread(target);
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

    function renderIdle() {
      settled = true;
      mode = 'idle';
      const fab = document.createElement('button');
      fab.className = 'fab';
      fab.innerHTML = ICON + '<span>Скачать книгу</span>';
      fab.addEventListener('click', renderMenu);
      setView(fab, true);
    }

    function renderMenu() {
      settled = false;
      mode = 'menu';
      const panel = document.createElement('div');
      panel.className = 'panel';
      const head = document.createElement('div');
      head.className = 'head';
      head.textContent = siteName;
      const list = document.createElement('div');
      list.className = 'fmt';

      const ordered = FORMATS.slice().sort((a, b) => {
        if (a.id === defaultFormat) return -1;
        if (b.id === defaultFormat) return 1;
        return 0;
      });
      for (const f of ordered) {
        const b = document.createElement('button');
        b.innerHTML = '<span>' + f.label + '</span><span class="hint">' + f.hint + '</span>';
        b.addEventListener('click', () => start(f.id));
        list.append(b);
      }
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
      label.textContent = 'Начинаю…';
      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('i');
      bar.append(fill);
      const row = document.createElement('div');
      row.className = 'row';
      const cancel = document.createElement('button');
      cancel.className = 'link';
      cancel.textContent = 'Отменить';
      cancel.addEventListener('click', () => {
        if (controller) controller.abort();
        renderIdle();
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
      again.textContent = error ? 'Попробовать другой формат' : 'Скачать ещё';
      again.addEventListener('click', renderMenu);
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
    return { host, renderMenu, start };
  }

  FK.ui = { create, FORMATS };
  return FK;
});

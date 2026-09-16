// Мост между расширением и ядром VireGlass. Собирается esbuild'ом в src/lib/glass.js
// (IIFE, глобальная FKGlass) — расширение в рантайме остаётся без зависимостей.
//
// Деталь лежит поверх ЧУЖОГО живого DOM, растра которого нет: снимок вкладки требует
// <all_urls>, троттлится, снимает вместе с виджетом и устаревает на любом скролле.
// Поэтому проход линзы выключен, а её обязанности разнесены:
//
//   пропускание  — backdrop-filter браузера, живое и никогда не устаревает;
//   фаска и свет — проход ПОВЕРХНОСТИ ядра;
//   читаемость   — bodyDensityFor/bodyLuma ядра: плотность приходит числом, CSS её
//                  только красит. Без неё подписи панели сталкиваются с текстом страницы.
//
// Сцена остаётся источником замера для зонда: её заливает локальный цвет страницы.
import {
  CONFIRMATIONS,
  MATERIAL_RANGES,
  VIREGLASS_CONTROL_MATERIAL,
  activeMaterial,
  applyToggles,
  bevelDp,
  bodyDensityFor,
  bodyLuma,
  createDeform,
  halfMinDp,
  lensPadDp,
  materialForInk,
  resolveOptics,
  roundedRectGeometry,
  shouldInkBeLight,
  surfacePadDp,
} from '@vire/vireglass';
import { createVireGlassRenderer } from '@vire/vireglass/web';

// Деталь — орган управления (отсюда толщина, фаска и presence CONTROL-материала),
// но лежит она поверх ЖИВОГО экрана, а такому листу прозрачным быть нельзя: сквозь
// него читается страница и спорит с его собственными подписями. Лечится это не
// затемнением, а шероховатостью — её и берём у листового материала ядра.
const MATERIAL = materialForInk(
  // Шероховатость — на потолке модели: у листового материала 0.85, и сквозь него всё
  // ещё пролезают светлые пятна от текста страницы. Деталь лежит поверх живого текста,
  // мутность здесь работает на читаемость, а не на красоту.
  { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
  true,
);

/** Доля нового замера на кадр — тот же порядок, что SETTLE рендерера: параметры
 *  материала обязаны подъезжать к новым, а не прыгать. */
const SETTLE = 0.12;

/** Настоящая плотность экрана — та же, что подаёт стенд. */
const density = () => window.devicePixelRatio || 1;

/**
 * Карта смещений для feDisplacementMap: R/G — сдвиг выборки по x/y.
 *
 * Это и есть преломление ЖИВОГО DOM. Форма — тот же скруглённый прямоугольник, что у
 * ядра, величины — из его оптики: ширина фаски задаёт полосу, где поверхность наклонена,
 * `edgePushDp` — насколько уводится луч. Снимок страницы для этого не нужен.
 */
function displacementMap(width: number, height: number, radius: number, bevel: number, push: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  const hx = w / 2;
  const hy = h / 2;
  const r = Math.min(radius, Math.min(hx, hy));
  const band = Math.max(1, bevel);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5 - hx;
      const py = y + 0.5 - hy;
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      const mx = Math.max(qx, 0);
      const my = Math.max(qy, 0);
      const d = Math.hypot(mx, my) + Math.min(Math.max(qx, qy), 0) - r;

      let nx = 0;
      let ny = 0;
      if (d < 0) {
        // Наклон поверхности растёт к контуру и сходит на нет вглубь фаски.
        const t = Math.min(1, Math.max(0, 1 + d / band));
        if (t > 0) {
          if (mx > 0 && my > 0) {
            const len = Math.hypot(mx, my) || 1;
            nx = (mx / len) * Math.sign(px);
            ny = (my / len) * Math.sign(py);
          } else if (qx > qy) {
            nx = Math.sign(px);
          } else {
            ny = Math.sign(py);
          }
          // Луч уводится ВНУТРЬ детали: у кромки видно сжатие, как в линзе.
          const k = -(t * t);
          nx *= k;
          ny *= k;
        }
      }
      const i = (y * w + x) * 4;
      img.data[i] = Math.round(128 + nx * 127);
      img.data[i + 1] = Math.round(128 + ny * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function createGlassSurface(canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number) {
  const renderer = createVireGlassRenderer(canvas, { alpha: true });
  const deform = createDeform();

  // Запас считаем по самой крупной форме и держим канвас неподвижным: resize
  // пересоздаёт текстуры, а во время морфинга габарит меняется каждый кадр.
  const widest = roundedRectGeometry(maxWidth, maxHeight, 28);
  const pad = Math.ceil(lensPadDp(widest, resolveOptics(MATERIAL)) + surfacePadDp(widest));

  const boxW = maxWidth + pad * 2;
  const boxH = maxHeight + pad * 2;
  canvas.style.width = boxW + 'px';
  canvas.style.height = boxH + 'px';

  // Плотность может смениться на ходу (окно уехало на другой монитор), а resize
  // пересоздаёт текстуры — потому только при реальной смене, не каждый кадр.
  let scale = 0;
  function fit(next: number) {
    if (next === scale) return;
    scale = next;
    renderer.resize(Math.ceil(boxW * scale), Math.ceil(boxH * scale));
  }
  fit(density());

  let backdrop = '#ffffff';
  let spreadTarget = 0;
  let spread = 0;
  let settledAlpha = -1;
  let settledLevel = -1;
  let inkLight = true;
  let confirmations = 0;
  let last: unknown = null;
  let prev = 0;
  /** Текущая форма детали — от неё стенд считает ход тяги и радиус пальца. */
  let shape = widest;

  const scene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, w, h);
  };

  return {
    /** Отступ канваса за габарит детали: тень, фаска и сбор света уходят наружу формы. */
    pad,
    setBackdropColor(color: string) {
      backdrop = color;
    },
    /** Разнородность фона под деталью, 0…1 — параметр `spread` модели. Зонд снимает её
     *  с нарисованной сцены, а наша сцена ровная: пестроту живой страницы туда не подать.
     *  Без неё модель считает фон однородным и плотности не требует — тогда подписи
     *  панели ложатся прямо на текст страницы. */
    setSpread(value: number) {
      spreadTarget = Math.min(1, Math.max(0, value));
    },
    /** Доехали ли параметры материала до цели — по этому решают, рисовать ли дальше. */
    settled: () => Math.abs(spread - spreadTarget) < 0.005,

    /** Отклик на курсор — пружины ядра и его же пропорции, что на стенде:
     *  ход тяги и радиус пальца берутся от полуразмера детали, не «на глаз». */
    grab: (x: number, y: number) => deform.grab(x, y, 3.2),
    drag(dx: number, dy: number) {
      deform.drag(dx, dy, 0.14 * halfMinDp(shape));
    },
    release: () => deform.release(1.8),
    idle: () => deform.idle(),

    /**
     * Преломление живого DOM: карта смещений под feDisplacementMap плюс величина
     * сдвига и мутность — всё из оптики ядра. Пересчитывается только на смену формы:
     * это растр, и гонять его каждый кадр морфинга незачем.
     */
    refraction(width: number, height: number, cornerRadius: number) {
      const geometry = roundedRectGeometry(width, height, cornerRadius);
      const optics = resolveOptics(MATERIAL);
      const bevel = bevelDp(geometry, optics);
      // Насколько фаска гнёт луч. edgePushDp сюда не годится: он задаёт выборку внутри
      // шейдера с его запасом вьюхи, и в CSS-карте даёт десятки пикселей на мелкой детали.
      const push = bevel * optics.refraction;
      return {
        map: displacementMap(width, height, cornerRadius, bevel, push),
        scale: push * 2,
        blur: optics.blur,
      };
    },

    /** Возвращает, должна ли надпись поверх стекла быть светлой. */
    draw(width: number, height: number, cornerRadius: number) {
      fit(density());
      const now = performance.now();
      deform.step(prev ? Math.min((now - prev) / 1000, 0.25) : 0);
      prev = now;

      const geometry = roundedRectGeometry(width, height, cornerRadius);
      shape = geometry;
      const d = deform.sample();
      // Активность — состояние СРЕДЫ: плотнее и чище стекло, а не подсветка поверх.
      // Ровно так собирает материал кнопки стенд.
      const material = { ...activeMaterial(MATERIAL, d.active), ink: inkLight ? 1 : 0 };
      // Тело поверхность не красит: единственное тело — адаптивное, ниже из
      // bodyDensityFor. Две заливки дали бы двойную плотность (adapters.ts, u_tint).
      const optics = applyToggles(resolveOptics(material), { tint: false });
      // Координаты детали — от левого верхнего угла канваса (шейдеры получают
      // перевёрнутый Y транспайлером, см. targets/glsl.ts).
      const centerX = (boxW - pad - width / 2) * scale;
      const centerY = (boxH - pad - height / 2) * scale;

      const { probes } = renderer.render({
        density: scale,
        debug: 'normal',
        scene,
        backdrop: false,
        pieces: [
          {
            optics,
            geometry,
            centerX,
            centerY,
            lens: false,
            press: d.press,
            active: d.active,
            // Успокоившаяся деталь — ровно нейтральный материал. Точка касания живёт
            // дольше самой деформации, и на сменившей габарит форме она остаётся
            // продавленной в устаревшем месте — видно пятном на пустом месте.
            touch: deform.idle()
              ? undefined
              : {
                  x: d.touchX,
                  y: d.touchY,
                  pullX: d.pullX,
                  pullY: d.pullY,
                  press: d.press,
                  radius: 0.72 * halfMinDp(geometry),
                  waveAmp: d.waveAmp,
                  wavePhase: d.wavePhase,
                },
          },
        ],
      });

      // Полярность надписи решает приложение, а не шейдер: без этого над светлой
      // страницей деталь становится ровной серой плашкой с нечитаемым текстом.
      const stats = probes[0];
      last = stats;
      if (stats) {
        const wants = shouldInkBeLight(stats, material.legibility, inkLight);
        if (wants === inkLight) {
          confirmations = 0;
        } else if (++confirmations >= CONFIRMATIONS) {
          inkLight = wants;
          confirmations = 0;
        }
      }

      // Плотность, которую тело обязано набрать над этим фоном, чтобы надпись читалась.
      // Считает ядро, CSS только красит. Цвет тинта выводим из bodyLuma, чтобы не
      // дублировать его константы: итог = local + (tint - local) × density.
      // Пестрота подъезжает к новой оценке, а не прыгает к ней: скачок плотности
      // читается вспышкой по телу — ровно то, от чего в рендерере сделан SETTLE.
      spread += (spreadTarget - spread) * SETTLE;

      const local = stats ? stats.luma : 1;
      const alpha = bodyDensityFor(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const aim = bodyLuma(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const tint = alpha > 1e-3 ? (aim - local * (1 - alpha)) / alpha : material.ink > 0.5 ? 0 : 1;
      const level = Math.round(Math.min(1, Math.max(0, tint)) * 255);
      // Полярность переключается ступенькой, поэтому цвет тинта тоже подводим.
      settledAlpha = settledAlpha < 0 ? alpha : settledAlpha + (alpha - settledAlpha) * SETTLE;
      settledLevel = settledLevel < 0 ? level : settledLevel + (level - settledLevel) * SETTLE;

      return {
        inkLight,
        body: `rgba(${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${settledAlpha.toFixed(3)})`,
      };
    },

    /** Последний замер фона и решение по надписи — для отладки материала. */
    probe: () => ({ stats: last, inkLight, backdrop }),
    destroy: () => renderer.destroy(),
  };
}

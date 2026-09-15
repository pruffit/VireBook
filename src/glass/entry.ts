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
  VIREGLASS_CONTROL_MATERIAL,
  activeMaterial,
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

const MATERIAL = materialForInk(VIREGLASS_CONTROL_MATERIAL, true);

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
  let shot: CanvasImageSource | null = null;
  let shotW = 0;
  let shotH = 0;
  let shotDpr = 1;
  let viewLeft = 0;
  let viewTop = 0;
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
      const optics = resolveOptics(material);
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
            touch: {
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

      // Читаемость: сколько плотности тело обязано набрать над этим фоном. Решает
      // ядро, CSS только красит. Цвет тинта выводим из bodyLuma, чтобы не дублировать
      // его константы: итог = local + (tint - local) * density.
      const local = stats ? stats.luma : 1;
      const spread = stats ? stats.busy : 0;
      const alpha = bodyDensityFor(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const target = bodyLuma(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const tint = alpha > 1e-3 ? (target - local * (1 - alpha)) / alpha : material.ink > 0.5 ? 0 : 1;
      const level = Math.round(Math.min(1, Math.max(0, tint)) * 255);

      return { inkLight, body: `rgba(${level}, ${level}, ${level}, ${alpha.toFixed(3)})` };
    },

    /** Последний замер фона и решение по надписи — для отладки материала. */
    probe: () => ({ stats: last, inkLight, backdrop }),
    destroy: () => renderer.destroy(),
  };
}

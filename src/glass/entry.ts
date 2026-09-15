// Мост между расширением и ядром VireGlass. Собирается esbuild'ом в src/lib/glass.js
// (IIFE, глобальная FKGlass) — расширение в рантайме остаётся без зависимостей.
//
// Деталь лежит поверх ЧУЖОГО живого содержимого, пикселей которого у нас нет. Поэтому
// проход линзы выключен: она сэмплирует сцену и закрыла бы страницу непрозрачной
// заливкой. Работает проход ПОВЕРХНОСТИ — фаска, Френель, блик, кромка, тень, — а
// пропускание даёт браузер под прозрачным канвасом.
//
// Сцена при этом не бесполезна: по ней зонд снимает светлоту фона, и от неё зависят
// плотность тела и полярность надписи. Её заливают локальным цветом страницы.
import {
  CONFIRMATIONS,
  VIREGLASS_CONTROL_MATERIAL,
  activeMaterial,
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
      return inkLight;
    },

    /** Последний замер фона и решение по надписи — для отладки материала. */
    probe: () => ({ stats: last, inkLight, backdrop }),
    destroy: () => renderer.destroy(),
  };
}

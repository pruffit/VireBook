// Мост между расширением и ядром VireGlass. Собирается esbuild'ом в src/lib/glass.js
// (IIFE, глобальная FKGlass) — расширение в рантайме остаётся без зависимостей.
//
// Линза преломляет то, что нарисовано в сцену, а не DOM. Поэтому сценой служит снимок
// видимой области вкладки (chrome.tabs.captureVisibleTab), сдвинутый так, чтобы под
// деталью оказались те самые пиксели страницы, что под ней и есть.
import {
  CONFIRMATIONS,
  VIREGLASS_CONTROL_MATERIAL,
  createDeform,
  lensPadDp,
  materialForInk,
  resolveOptics,
  roundedRectGeometry,
  shouldInkBeLight,
  surfacePadDp,
} from '@vire/vireglass';
import { createVireGlassRenderer } from '@vire/vireglass/web';

const MATERIAL = materialForInk(VIREGLASS_CONTROL_MATERIAL, true);

/** Плотность режем двойкой: кадр растёт квадратом, а деталь мелкая. */
const density = () => Math.min(window.devicePixelRatio || 1, 2);

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

  let shot: CanvasImageSource | null = null;
  let shotDpr = 1;
  let viewLeft = 0;
  let viewTop = 0;
  let fallback = '#ffffff';
  let inkLight = true;
  let confirmations = 0;
  let last: unknown = null;
  let prev = 0;

  // Сцена — то, что под деталью на самом деле. Снимок кладётся так, чтобы точка
  // (viewLeft, viewTop) вьюпорта пришлась на левый верхний угол канваса.
  const scene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    if (!shot) {
      // Снимка ещё нет (первый кадр, отказ разрешения) — материал всё равно обязан
      // решить свою плотность, а для этого хватает локального цвета фона страницы.
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const k = scale / shotDpr;
    const iw = (shot as HTMLImageElement).width ?? 0;
    const ih = (shot as HTMLImageElement).height ?? 0;
    ctx.drawImage(shot, -viewLeft * scale, -viewTop * scale, iw * k, ih * k);
  };

  return {
    /** Отступ канваса за габарит детали: тень, фаска и сбор света уходят наружу формы. */
    pad,

    /** Снимок вкладки и положение канваса во вьюпорте (CSS-пиксели). */
    setBackdrop(image: CanvasImageSource | null, dpr: number, left: number, top: number) {
      shot = image;
      shotDpr = dpr || 1;
      viewLeft = left;
      viewTop = top;
    },
    setFallbackColor(color: string) {
      fallback = color;
    },

    /** Отклик на курсор — пружины ядра, не своя анимация. */
    grab: (x: number, y: number) => deform.grab(x, y, 3.2),
    drag: (dx: number, dy: number) => deform.drag(dx, dy, 14),
    release: () => deform.release(1.8),
    idle: () => deform.idle(),

    /** Возвращает, должна ли надпись поверх стекла быть светлой. */
    draw(width: number, height: number, cornerRadius: number) {
      fit(density());
      const now = performance.now();
      deform.step(prev ? Math.min((now - prev) / 1000, 0.25) : 0);
      prev = now;

      const geometry = roundedRectGeometry(width, height, cornerRadius);
      const material = { ...MATERIAL, ink: inkLight ? 1 : 0 };
      const optics = resolveOptics(material);
      const d = deform.sample();
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
            press: d.press,
            active: d.active,
            touch: {
              x: d.touchX,
              y: d.touchY,
              pullX: d.pullX,
              pullY: d.pullY,
              press: d.press,
              radius: Math.max(26, Math.min(width, height) * 0.62),
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
    probe: () => ({ stats: last, inkLight, hasShot: Boolean(shot) }),
    destroy: () => renderer.destroy(),
  };
}

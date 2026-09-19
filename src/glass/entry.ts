// The bridge between the extension and the VireGlass core. esbuild compiles this
// into src/glass/vireglass.bundle.js (an ES module, committed) so the extension
// can be built without access to the private monorepo.
//
// The pane lies over SOMEONE ELSE'S live DOM, of which we have no raster: a tab
// snapshot needs <all_urls>, is throttled, captures the widget along with the
// page and goes stale on any scroll. So the lens pass is off and its duties are
// split up:
//
//   transmission  — the browser's backdrop-filter, live and never stale;
//   bevel & light — the core's SURFACE pass;
//   legibility    — the core's bodyDensityFor/bodyLuma: density arrives as a
//                   number and CSS only paints it. Without it the panel's own
//                   labels collide with the text of the page.
//
// The scene stays as the probe's source of measurement: it is flooded with the
// local colour of the page.
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

// The pane is a control (hence the thickness, bevel and presence of the CONTROL
// material), but it lies over a LIVE screen, and such a sheet must not be
// transparent: the page reads through it and argues with its own labels. The
// cure is not darkening but roughness — which we take at the model's ceiling.
const MATERIAL = materialForInk(
  // Roughness at the ceiling of the model: the sheet material sits at 0.85 and
  // bright patches of page text still push through. The pane lies over live
  // text, so here haze works for legibility, not for looks.
  { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
  true,
);

/** Share of a new measurement per frame — the same order as the renderer's
 *  SETTLE: material parameters must ease towards new values, not jump. */
const SETTLE = 0.12;

/** The real screen density, the same one the reference harness feeds in. */
const density = () => window.devicePixelRatio || 1;

/**
 * The displacement map for feDisplacementMap: R/G are the sample shift in x/y.
 *
 * This is the refraction of the LIVE DOM. The shape is the same rounded
 * rectangle the core uses, the magnitudes come from its optics: the bevel width
 * sets the band where the surface is tilted, `edgePushDp` how far the ray is
 * bent. No page snapshot is needed for any of it.
 */
function displacementMap(
  width: number,
  height: number,
  radius: number,
  bevel: number,
  push: number,
): string {
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
        // The surface tilt grows towards the contour and fades away into the bevel.
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
          // The ray is bent INWARDS: you see the squeeze at the rim, as in a lens.
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

/** The window corner the pane is pinned to. The canvas is fixed and sized for
 *  the largest shape — it is the pane that moves around inside it. */
export type GlassAnchor = 'br' | 'bl' | 'tr' | 'tl';

export interface Refraction {
  map: string;
  scale: number;
  blur: number;
}

export interface GlassPaint {
  inkLight: boolean;
  body: string;
}

export function createGlassSurface(canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number) {
  const renderer = createVireGlassRenderer(canvas, { alpha: true });
  const deform = createDeform();

  // The margin is computed from the largest shape and the canvas is kept still:
  // resize recreates textures, and during a morph the size changes every frame.
  const widest = roundedRectGeometry(maxWidth, maxHeight, 28);
  const pad = Math.ceil(lensPadDp(widest, resolveOptics(MATERIAL)) + surfacePadDp(widest));

  const boxW = maxWidth + pad * 2;
  const boxH = maxHeight + pad * 2;
  canvas.style.width = boxW + 'px';
  canvas.style.height = boxH + 'px';

  // Density can change mid-flight (the window moved to another monitor), and
  // resize recreates textures — hence only on a real change, not every frame.
  let scale = 0;
  function fit(next: number): void {
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
  let aimAlpha = -1;
  let aimLevel = -1;
  let inkLight = true;
  let confirmations = 0;
  let last: unknown = null;
  let prev = 0;
  /** The pane's current shape — the pull travel and finger radius come off it. */
  let shape = widest;

  const scene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, w, h);
  };

  return {
    /** How far the canvas reaches past the pane: shadow, bevel and light gathering
     *  all fall outside the shape. */
    pad,

    setBackdropColor(color: string) {
      backdrop = color;
    },

    /** Busyness of the background under the pane, 0…1 — the model's `spread`.
     *  The probe reads it off the drawn scene, and our scene is flat: the
     *  variegation of a live page cannot be fed in there. Without it the model
     *  considers the background uniform and asks for no density — and then the
     *  panel's labels land straight on the page's text. */
    setSpread(value: number) {
      spreadTarget = Math.min(1, Math.max(0, value));
    },

    /** Whether the material has arrived — this decides whether to keep drawing.
     *  Asking about busyness alone is not enough: body density and colour ease in
     *  on their own SETTLE, and ink polarity waits CONFIRMATIONS frames. Stop
     *  earlier and on a slow machine the panel freezes half-arrived: the body at
     *  half strength, the ink still the old polarity. */
    settled: () =>
      Math.abs(spread - spreadTarget) < 0.005 &&
      confirmations === 0 &&
      (aimAlpha < 0 || Math.abs(settledAlpha - aimAlpha) < 0.002) &&
      (aimLevel < 0 || Math.abs(settledLevel - aimLevel) < 0.5),

    /** Response to the cursor — the core's springs and its own proportions:
     *  pull travel and finger radius come off the pane's half-size, not guesswork. */
    grab: (x: number, y: number) => deform.grab(x, y, 3.2),
    drag(dx: number, dy: number) {
      deform.drag(dx, dy, 0.14 * halfMinDp(shape));
    },
    release: () => deform.release(1.8),
    idle: () => deform.idle(),

    /**
     * Refraction of the live DOM: the map for feDisplacementMap plus the shift
     * magnitude and the haze, all out of the core's optics. Recomputed only when
     * the shape changes: it is a raster, and re-rasterising it every morph frame
     * would be pointless.
     */
    refraction(width: number, height: number, cornerRadius: number): Refraction {
      const geometry = roundedRectGeometry(width, height, cornerRadius);
      const optics = resolveOptics(MATERIAL);
      const bevel = bevelDp(geometry, optics);
      // How hard the bevel bends the ray. edgePushDp will not do here: it drives
      // sampling inside the shader with its own view margin, and in a CSS map it
      // yields tens of pixels on a small pane.
      const push = bevel * optics.refraction;
      return {
        map: displacementMap(width, height, cornerRadius, bevel, push),
        scale: push * 2,
        blur: optics.blur,
      };
    },

    /** Returns whether the lettering over the glass should be light. */
    draw(width: number, height: number, cornerRadius: number, anchor: GlassAnchor = 'br'): GlassPaint {
      fit(density());
      const now = performance.now();
      deform.step(prev ? Math.min((now - prev) / 1000, 0.25) : 0);
      prev = now;

      const geometry = roundedRectGeometry(width, height, cornerRadius);
      shape = geometry;
      const d = deform.sample();
      // Activity is a state of the MEDIUM: denser, cleaner glass, not a glow laid
      // on top. This is exactly how the reference harness builds a button material.
      const material = { ...activeMaterial(MATERIAL, d.active), ink: inkLight ? 1 : 0 };
      // The surface does not paint the body: the only body is the adaptive one,
      // from bodyDensityFor below. Two fills would give double density
      // (adapters.ts, u_tint).
      const optics = applyToggles(resolveOptics(material), { tint: false });
      // Pane coordinates run from the canvas's top-left corner (the shaders get a
      // flipped Y from the transpiler, see targets/glsl.ts). The pane is pinned to
      // the same canvas corner the widget is pinned to in the window: the canvas
      // must not be recreated, and moving to another corner is routine.
      const left = anchor === 'bl' || anchor === 'tl' ? pad : boxW - pad - width;
      const top = anchor === 'tl' || anchor === 'tr' ? pad : boxH - pad - height;
      const centerX = (left + width / 2) * scale;
      const centerY = (top + height / 2) * scale;

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
            // A settled pane is exactly the neutral material. The touch point
            // outlives the deformation itself, and on a shape that has changed
            // size it stays pressed in at a stale spot — visible as a blob on
            // empty ground.
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

      // The application decides ink polarity, not the shader: without this, over
      // a light page the pane becomes a flat grey slab with unreadable text.
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

      // The density the body must reach over this background for the lettering to
      // read. The core computes it, CSS only paints. The tint colour is derived
      // from bodyLuma so its constants are not duplicated:
      // result = local + (tint - local) × density.
      // Busyness eases towards a new estimate rather than jumping to it: a jump in
      // density reads as a flash across the body — exactly what SETTLE exists for
      // in the renderer.
      spread += (spreadTarget - spread) * SETTLE;

      const local = stats ? stats.luma : 1;
      const alpha = bodyDensityFor(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const aim = bodyLuma(local, material.legibility, optics.bodyDensity, material.ink, spread);
      const tint = alpha > 1e-3 ? (aim - local * (1 - alpha)) / alpha : material.ink > 0.5 ? 0 : 1;
      const level = Math.round(Math.min(1, Math.max(0, tint)) * 255);
      // Polarity switches in a step, so the tint colour is eased in as well.
      aimAlpha = alpha;
      aimLevel = level;
      settledAlpha = settledAlpha < 0 ? alpha : settledAlpha + (alpha - settledAlpha) * SETTLE;
      settledLevel = settledLevel < 0 ? level : settledLevel + (level - settledLevel) * SETTLE;

      return {
        inkLight,
        body: `rgba(${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${settledAlpha.toFixed(3)})`,
      };
    },

    /** The last background measurement and ink decision — for debugging the material. */
    probe: () => ({ stats: last, inkLight, backdrop }),
    destroy: () => renderer.destroy(),
  };
}

export type GlassSurface = ReturnType<typeof createGlassSurface>;

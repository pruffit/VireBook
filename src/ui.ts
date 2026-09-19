// The floating panel on the page. Everything lives in a shadow DOM: book sites
// love global !important rules, and the widget has to look the same everywhere.
//
// The material is VireGlass carried over into CSS. The shader lens cannot come
// here: WebGL does not see the DOM and cannot refract the live page beneath it,
// and refracting the page is the entire point of the glass. backdrop-filter can,
// so the causes of the material are expressed through it: the haze of the sheet,
// the density of the body, the bevel, the rim.
//
// The pane lives in one of the four corners of the window and can be dragged to
// any other: there is chapter text underneath it, and only the reader knows
// which spot is in the way.
import type { Format } from './types.ts';
import { createGlassSurface, type GlassAnchor, type GlassSurface } from './glass/vireglass.bundle.js';

const CSS = `
:host {
  all: initial;
  /* The vire palette: a warm near-black; the accent is not colour but a lift of the surface. */
  --vg-body: oklch(0.115 0.006 75);
  --vg-deep: oklch(0.085 0.006 75);
  --vg-ink: oklch(0.93 0.008 83);
  --vg-dim: oklch(0.62 0.009 80);
  /* Lighter than the vire token for the same reason as legibility: on a dark
     body oklch(0.55 …) does not read. Same hue. */
  --vg-alarm: oklch(0.74 0.16 27);
  --vg-warn: oklch(0.78 0.12 70);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --morph: 0.34s;
  --r-sheet: 26px;
  --pad: 6px;
  --r-item: 20px;
  /* Distance from the edge of the window. */
  --edge: 18px;
  /* Slack of the refraction layer past the sheet — see .refract. */
  --slack: 40px;
}
* { box-sizing: border-box; font-family: -apple-system, "Segoe UI", Roboto, Ubuntu, sans-serif; }

.root { position: fixed; z-index: 2147483000; }
/* The corner is set by classes: the panel grows out of the corner it is pinned to. */
.root.x-right { right: var(--edge); }
.root.x-left { left: var(--edge); }
.root.y-bottom { bottom: var(--edge); }
.root.y-top { top: var(--edge); }
/* A throw into another corner finishes the very motion the pane was dragged by. */
.root.gliding { transition: transform 0.38s var(--ease); }
.root.dragging { transition: none; }
.root.dragging, .root.dragging * { cursor: grabbing !important; user-select: none; }
/* Ink polarity follows the background: over a very light page the body of the
   glass cannot go dark enough, and light text on it is unreadable. */
.root.ink-dark {
  --vg-ink: oklch(0.24 0.012 75);
  --vg-dim: oklch(0.46 0.012 78);
  --vg-alarm: oklch(0.48 0.19 27);
  --vg-warn: oklch(0.52 0.12 62);
}
.fab, .head, .fmt button, .fmt .hint, .label, .link, .err, .note {
  transition: color .42s var(--ease);
}

/* The VireGlass core draws the material into this canvas: body, bevel, Fresnel,
   highlight and shadow as consequences of the material's causes, not a pile of
   CSS shadows. The canvas is wider than the pane: shadow and light gathering
   reach outside the shape. */
.glass { position: absolute; pointer-events: none; z-index: 0; }

.shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--r-sheet);
  /* The pane is dragged by finger — the browser must not scroll the page
     instead, and a drag across it must not select its own labels. */
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

/* Refraction of the live DOM. The layer is WIDER than the sheet and sits inside
   the shell rather than on it, for two reasons at once:
     slack — the blur and the displacement need something to gather under the
             rim, otherwise the edge pulls in emptiness from past the filter region;
     clip  — with slack, backdrop-filter spills the filtered background past the
             bounds of its own element, and a rectangle shows around the rounded
             shape. Here the spill is cut off by overflow.
   The separate .clip is not decoration: while backdrop-filter sits directly in
   the shell, whose height is moving through a morph, and the sheet is pinned by
   its TOP, Chromium stops recomputing the position of the neighbouring layers —
   the panel's content stays lifted by a couple of dozen pixels and escapes the
   clip. Its own wrapper with overflow unties that. */
.clip {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.refract { position: absolute; inset: calc(var(--slack) * -1); }
/* The body goes ABOVE the refraction. As a background of the shell it would be
   pulled into the refraction: a parent's background is part of its own child's
   backdrop. */
.tint { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
/* The light that blooms under a finger. When the medium goes active the core
   raises its presence and its ior; on a surface pass that reads as a brighter
   rim and a specular bloom, and this is the part of it CSS can wear directly.
   Position and radius come from the core's own contact spot — the finger has an
   area, not a point — and they arrive as custom properties so a frame writes
   three numbers rather than re-parsing a gradient string. */
.glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: var(--g-a, 0);
  background: radial-gradient(
    circle var(--g-r, 90px) at var(--g-x, 50%) var(--g-y, 50%),
    color-mix(in oklch, var(--vg-ink) 30%, transparent),
    transparent 72%
  );
}

/* The fallback material when WebGL2 is unavailable: the extension has to work
   without the glass too. */
.shell.flat {
  background: color-mix(in oklch, var(--vg-body) 90%, transparent);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--vg-ink) 22%, transparent),
    0 0 0 1px color-mix(in oklch, var(--vg-ink) 10%, transparent),
    0 20px 44px -16px color-mix(in oklch, var(--vg-deep) 85%, transparent);
}

/* Arriving content waits for the shape. The sheet takes --morph to travel, and
   content that turns opaque inside the first third of it is read through a box
   still growing around it — clipped on the side the sheet has not reached yet,
   so the text appears to slide out of a hole rather than the panel to unfold.
   The delay is most of the morph: the shape forms, then the content resolves
   into it. */
.view {
  position: absolute;
  z-index: 2;
  opacity: 0;
  transition: opacity .2s var(--ease) .15s;
}
/* Leaving content does not wait for anything: it is being replaced, and
   lingering under the arriving one turns a cross-fade into a smear. */
.view.leaving { transition: opacity .12s var(--ease); }
/* The content is pinned to the same corner the sheet grows from: otherwise it
   drifts away from the edge during the morph. */
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

.panel { width: 268px; padding: var(--pad); }
.head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 9px; font-size: 12px; letter-spacing: .02em; color: var(--vg-dim);
  cursor: grab;
}
.head .site { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.head .grip { flex: none; margin-left: auto; opacity: .55; }
.fmt { display: flex; flex-direction: column; }
/* Concentric: sheet radius 20 = item radius 14 + padding 6. */
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

.pad { width: 268px; padding: 13px 14px 14px; }
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

const ICON =
  '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.8v8.4M4.6 7l3.4 3.4L11.4 7M2.2 13.4h11.6"/></svg>';
const GRIP =
  '<svg class="grip" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><circle cx="3" cy="2.5" r="1"/><circle cx="9" cy="2.5" r="1"/><circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="3" cy="9.5" r="1"/><circle cx="9" cy="9.5" r="1"/></svg>';

export interface FormatChoice {
  id: Format;
  label: string;
  hint: string;
}

export const FORMATS: FormatChoice[] = [
  { id: 'epub', label: 'EPUB', hint: 'for Send to Kindle' },
  { id: 'mobi', label: 'MOBI', hint: 'to Kindle over USB' },
  { id: 'fb2', label: 'FB2', hint: 'phone, PocketBook' },
  { id: 'txt', label: 'TXT', hint: 'plain text' },
];

/** Window corners: first letter top/bottom, second left/right. */
export const CORNERS: GlassAnchor[] = ['br', 'bl', 'tr', 'tl'];
/** How far the finger must travel before this counts as a move, not a press. */
const DRAG_START = 7;
/** The pane never leaves the window: this much of its edge stays inside. */
const KEEP_IN = 8;

function normalizeCorner(value: string | null | undefined): GlassAnchor {
  return CORNERS.includes(value as GlassAnchor) ? (value as GlassAnchor) : 'br';
}

export interface DownloadRequest {
  format: Format;
  progress: (text: string, percent?: number) => void;
  signal: AbortSignal;
}

export interface DownloadResult {
  filename: string;
  note?: string;
}

export interface WidgetOptions {
  siteName: string;
  defaultFormat?: Format;
  corner?: string | null;
  onCornerChange?: (corner: GlassAnchor) => void;
  onDownload: (request: DownloadRequest) => Promise<DownloadResult>;
}

export interface Widget {
  host: HTMLElement;
  openMenu(): void;
  start(format: Format): Promise<void>;
  moveTo(corner: GlassAnchor): void;
  corner(): GlassAnchor;
}

export function create({
  siteName,
  defaultFormat,
  corner,
  onCornerChange,
  onDownload,
}: WidgetOptions): Widget {
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
  const glowEl = document.createElement('div');
  glowEl.className = 'glow';
  shell.append(clipEl, tintEl, glowEl);
  rootEl.append(canvas, shell);

  // The refraction filter lives in the shadow tree: url(#…) inside a
  // backdrop-filter resolves within it, and the page knows nothing about it.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const filterEl = document.createElementNS(SVGNS, 'filter');
  filterEl.setAttribute('id', 'vg-refract');
  // sRGB is mandatory. By default SVG computes a filter in linearRGB, and then
  // the neutral middle of the map (128) arrives at the shader as 55 — a shift of
  // a third of the scale, which means the WHOLE backdrop under the pane slides
  // diagonally by ~9 px and the rim drags in whatever lies outside. The same
  // linearRGB washes out the scattering: over a dark page the pane used to glow.
  filterEl.setAttribute('color-interpolation-filters', 'sRGB');
  // The region is exactly the box of the REFRACTION LAYER, which is wider than
  // the sheet by --slack. The slack is for the blur and the displacement; the
  // rectangular spill past the shape is cut off by the clip (see .refract in CSS).
  filterEl.setAttribute('filterUnits', 'objectBoundingBox');
  filterEl.setAttribute('x', '0');
  filterEl.setAttribute('y', '0');
  filterEl.setAttribute('width', '1');
  filterEl.setAttribute('height', '1');
  // A neutral fill under the map: where there is no map the channel is zero,
  // and that is a shift by half the scale — the whole slack would slide.
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
  // Scattering FIRST, displacement second: in frosted glass the light scatters
  // inside the body, and there is nothing sharp left to refract afterwards. The
  // other way round, the rim drags still-sharp page text under the pane, and it
  // reads as dirty smears.
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

  /** Slack of the refraction layer, the same as the --slack token. */
  const SLACK = 40;
  // The largest shape's size: the canvas is placed under it once and is not
  // recreated afterwards — during a morph the size changes every frame.
  const MAX_W = 290;
  const MAX_H = 240;
  let glass: GlassSurface | null = null;
  try {
    glass = createGlassSurface(canvas, MAX_W, MAX_H);
  } catch {
    glass = null;
  }
  if (!glass) {
    canvas.remove();
    clipEl.remove();
    tintEl.remove();
    glowEl.remove();
    shell.classList.add('flat');
  }

  let at = normalizeCorner(corner);

  /** The canvas is pinned to the same corner as the widget: the pane moves
   *  inside it while it stays put — resize recreates textures. */
  function placeCanvas(): void {
    if (!glass) return;
    const off = -glass.pad + 'px';
    canvas.style.left = at[1] === 'l' ? off : '';
    canvas.style.right = at[1] === 'r' ? off : '';
    canvas.style.top = at[0] === 't' ? off : '';
    canvas.style.bottom = at[0] === 'b' ? off : '';
  }

  function applyCorner(): void {
    rootEl.classList.toggle('x-right', at[1] === 'r');
    rootEl.classList.toggle('x-left', at[1] === 'l');
    rootEl.classList.toggle('y-bottom', at[0] === 'b');
    rootEl.classList.toggle('y-top', at[0] === 't');
    placeCanvas();
    // The canvas moved at once, the pane inside it only on the next frame:
    // without this one frame the shadow and bevel are visibly offset from the sheet.
    if (glass && shell.offsetWidth) {
      glass.draw(
        shell.offsetWidth,
        shell.offsetHeight,
        parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0,
        at,
      );
    }
  }
  applyCorner();

  /** The material mixes its own lightness with the lightness of the background,
   *  so it needs the colour of the page under the widget, not "black by default". */
  function pageBackdrop(): string {
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
  /** The sheet radius, the same as the --r-sheet token. */
  const SHEET_RADIUS = 26;

  /** The shape travels on a transition, the cursor response on the core's
   *  springs. Both are per-frame, so there is one loop: it runs until the
   *  deadline and until the pane has settled. */
  function paintGlass(until?: number): void {
    if (!glass) return;
    // The deadline only moves outwards: a short call in the middle of a long one
    // must not cut short a run that has already started.
    paintUntil = Math.max(paintUntil, until || performance.now());
    if (painting) return;
    const frame = (): void => {
      painting = 0;
      const w = shell.offsetWidth;
      const h = shell.offsetHeight;
      if (w && h && glass) {
        const r = parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0;
        const out = glass.draw(w, h, r, at);
        rootEl.classList.toggle('ink-dark', !out.inkLight);
        tintEl.style.background = out.body;
        // The map is a raster built for the target shape, but the sheet is still
        // travelling. Stretch it to follow the live size: the field is smooth, so
        // the stretch is invisible, and the bevel stays glued to the real rim.
        fitMap(w, h);
        // The response to a finger, worn by the layers that actually draw. The
        // depth of the refraction and the haze come straight off the live optics,
        // so a press clears the medium up and bends it harder; the pull is the
        // core's spring, and the pane lags behind the finger by it.
        wear(out.blur, out.refract);
        glow(out, w, h);
        deformX = out.pullX;
        deformY = out.pullY;
        pressed = out.press;
        applyTransform();
      }
      if (performance.now() < paintUntil || !glass!.idle() || !glass!.settled()) {
        painting = requestAnimationFrame(frame);
      } else if (w && h) {
        // The displacement map is a raster: build it on a settled shape, not every frame.
        refract(w, h, parseFloat(getComputedStyle(shell).borderTopLeftRadius) || 0);
        // Busyness is measured by walking sample points — also on a settled
        // shape. Repaint only if it changed noticeably, or the loop wakes itself.
        const next = pageSpread();
        if (Math.abs(next - lastSpread) > 0.05) {
          lastSpread = next;
          glass!.setSpread(next);
          paintGlass(performance.now() + 500);
        }
      }
    };
    painting = requestAnimationFrame(frame);
  }

  interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  /**
   * Busyness of the background under the pane. The core's probe reads it off the
   * drawn scene, but we have no scene — the lens is off. We estimate it from the
   * DOM: the share of points under the panel where something, rather than empty
   * space, is lying. Over a flat background no density is needed, over text it
   * is, and that is the model's decision to make, not ours.
   */
  function pageSpread(rect?: Box): number {
    const box: Box = rect || shell.getBoundingClientRect();
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
        for (const el of document.elementsFromPoint(x, y)) {
          if (el === host || el === document.documentElement || el === document.body) continue;
          // A picture or non-empty text — what the model calls busyness.
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

  /** The core's probe needs the background colour: body density and ink polarity
   *  both depend on it. */
  function refreshBackdrop(): void {
    if (!glass) return;
    glass.setBackdropColor(pageBackdrop());
    lastSpread = pageSpread();
    glass.setSpread(lastSpread);
    paintGlass(performance.now() + 900);
  }

  // ── What the pane is wearing right now ────────────────────────────────────
  // One place composes the transform, because three things move the pane and
  // they overlap: the drag, the glide into a corner, and the core's pull spring.
  /** Offset from a drag in progress, CSS px. */
  let dragX = 0;
  let dragY = 0;
  /** Offset from the core's pull spring, CSS px. */
  let deformX = 0;
  let deformY = 0;
  /** How deep the press is, 0…1. */
  let pressed = 0;
  /** How far a full press sinks the pane. The core calls the press shallow, and
   *  a control that dives under the cursor reads as a button, not as glass. */
  const PRESS_SINK = 0.015;

  function applyTransform(): void {
    const x = dragX + deformX;
    const y = dragY + deformY;
    const scale = 1 - pressed * PRESS_SINK;
    const move = x || y ? `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)` : '';
    const sink = pressed > 0.001 ? ` scale(${scale.toFixed(4)})` : '';
    rootEl.style.transform = move || sink ? `${move}${sink}`.trim() : '';
  }

  let glowing = -1;
  /** The bloom under the finger. The core hands over where the contact is and
   *  how active the medium has become; the gradient only paints it. */
  function glow(out: { active: number; touchX: number; touchY: number; touchRadius: number }, w: number, h: number): void {
    const a = out.active;
    // Nothing lit and nothing left over — do not touch the style at all.
    if (a < 0.002 && glowing < 0.002) return;
    glowing = a;
    const st = glowEl.style;
    st.setProperty('--g-a', a.toFixed(3));
    st.setProperty('--g-x', (w / 2 + out.touchX).toFixed(1) + 'px');
    st.setProperty('--g-y', (h / 2 + out.touchY).toFixed(1) + 'px');
    st.setProperty('--g-r', out.touchRadius.toFixed(1) + 'px');
  }

  let wornBlur = -1;
  let wornRefract = -1;
  /** The live optics, onto the filter. Written every frame, so the two numbers
   *  are compared first: an SVG attribute write invalidates the filter, and
   *  re-running a displacement map over the backdrop at 60 Hz for no change is
   *  the one thing here expensive enough to notice. */
  function wear(blur: number, refract: number): void {
    if (Math.abs(blur - wornBlur) > 0.05) {
      wornBlur = blur;
      blurEl.setAttribute('stdDeviation', (blur / 2).toFixed(2));
    }
    if (Math.abs(refract - wornRefract) > 0.05) {
      wornRefract = refract;
      feDisp.setAttribute('scale', (refract * 2).toFixed(2));
    }
  }

  let mapFor = '';
  // Building the map is a loop over pixels plus PNG encoding, and it is
  // synchronous. The widget has only a handful of shapes, so each is built once.
  const mapCache = new Map<string, { map: string; scale: number; blur: number }>();

  /** The map lives in the coordinate system of the refraction layer, which is
   *  wider than the sheet by the slack: the sheet itself starts SLACK in. */
  function fitMap(w: number, h: number): void {
    feImage.setAttribute('x', String(SLACK));
    feImage.setAttribute('y', String(SLACK));
    feImage.setAttribute('width', String(w));
    feImage.setAttribute('height', String(h));
  }

  /** Refraction of the live DOM: the core computes the map and the shift,
   *  backdrop-filter applies them. Recomputed only when the shape changes. */
  function refract(w: number, h: number, r: number): void {
    if (!glass) return;
    const key = w + 'x' + h + 'r' + Math.round(r);
    if (key === mapFor) return;
    mapFor = key;
    let out = mapCache.get(key);
    if (!out) {
      out = glass.refraction(w, h, r);
      // The widget has only a few shapes, but a page can have its own zoom and
      // its own width: the cache must not grow without a bound.
      if (mapCache.size > 24) mapCache.clear();
      mapCache.set(key, out);
    }
    if (!out.map) return;
    feImage.setAttribute('href', out.map);
    fitMap(w, h);
    // Prime the depth and the haze for the settled material; from here on the
    // paint loop keeps writing them from the live optics, every frame.
    wear(out.blur, out.scale / 2);
    refractEl.style.backdropFilter = 'url(#vg-refract)';
    refractEl.style.setProperty('-webkit-backdrop-filter', 'url(#vg-refract)');
  }

  let controller: AbortController | null = null;
  let settled = true;
  let view: HTMLElement | null = null;
  let mode: 'idle' | 'menu' | 'progress' | 'result' = 'idle';

  /** The size is measured on a clone: the panel must slide in already at its
   *  final width, or the text reflows as the morph runs. */
  function measure(el: HTMLElement): { w: number; h: number } {
    const probe = el.cloneNode(true) as HTMLElement;
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

  // ── Moving the pane ────────────────────────────────────────────────────────
  // There is chapter text under the widget, and only the reader knows which
  // corner is free. The pane is dragged and let go: it lands in the nearest one.

  /** The nearest corner — by which quarter of the window the sheet's middle is in. */
  function nearestCorner(box: DOMRect): GlassAnchor {
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    return ((cy < innerHeight / 2 ? 't' : 'b') + (cx < innerWidth / 2 ? 'l' : 'r')) as GlassAnchor;
  }

  /** The move itself. The sheet is already drawn where it was released, so we
   *  first change the corner and then shift it back to its old place and let the
   *  shift go: otherwise it teleports. */
  function moveTo(next: string, animate: boolean): void {
    const target = normalizeCorner(next);
    const before = shell.getBoundingClientRect();
    at = target;
    applyCorner();
    rootEl.classList.remove('gliding');
    dragX = 0;
    dragY = 0;
    applyTransform();
    const after = shell.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (animate && (dx || dy)) {
      dragX = dx;
      dragY = dy;
      applyTransform();
      requestAnimationFrame(() => {
        rootEl.classList.add('gliding');
        dragX = 0;
        dragY = 0;
        applyTransform();
      });
    }
    if (onCornerChange) onCornerChange(at);
    // A different background under the new corner: both body density and ink polarity.
    refreshBackdrop();
  }

  /** The neighbouring corner in a direction; nowhere to go that way means staying. */
  function step(dir: 'left' | 'right' | 'up' | 'down'): void {
    const y = at[0];
    const x = at[1];
    if (dir === 'left') moveTo(y + 'l', true);
    else if (dir === 'right') moveTo(y + 'r', true);
    else if (dir === 'up') moveTo('t' + x, true);
    else moveTo('b' + x, true);
  }

  // The glide owns the transform transition only while it is gliding. Left on,
  // it would smear every later press: the spring updates the same property, and
  // a 0.38 s ease over it turns a response into a drift.
  rootEl.addEventListener('transitionend', (e) => {
    if (e.target === rootEl && e.propertyName === 'transform') rootEl.classList.remove('gliding');
  });

  let drag: { x: number; y: number; box: DOMRect; moving: boolean } | null = null;
  let dragged = false;

  shell.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    // A previous throw may have ended without a click — the flag must not
    // survive into the next press and swallow it.
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
    // No button down any more: the pointerup went somewhere we never heard about
    // — onto a native scrollbar, or out of the window while it lost focus. Left
    // armed, the next stray movement of the mouse drags the pane across the
    // screen without anyone touching it.
    if (e.buttons === 0) {
      letGo();
      return;
    }
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moving) {
      if (Math.hypot(dx, dy) < DRAG_START) {
        // Still a press, not a move: the glass stretches after the finger but
        // does not travel.
        if (glass) glass.drag(dx, dy);
        return;
      }
      drag.moving = true;
      dragged = true;
      rootEl.classList.remove('gliding');
      rootEl.classList.add('dragging');
      // The pane has come off the finger as a control and set off as an object —
      // the deformation is released for the duration.
      if (glass) glass.release();
    }
    const b = drag.box;
    dragX = Math.min(Math.max(dx, KEEP_IN - b.left), innerWidth - KEEP_IN - b.right);
    dragY = Math.min(Math.max(dy, KEEP_IN - b.top), innerHeight - KEEP_IN - b.bottom);
    applyTransform();
    if (glass) paintGlass();
  });

  function letGo(): void {
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
  }
  window.addEventListener('pointerup', letGo);
  window.addEventListener('pointercancel', letGo);

  // Letting go after a move is not a press: otherwise throwing the pane would
  // open the menu, and throwing it out of the menu would start a download.
  rootEl.addEventListener(
    'click',
    (e) => {
      if (!dragged) return;
      dragged = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );

  // Alt+arrows do the same from the keyboard. Plain arrows belong to the format
  // list and must not be taken away from it.
  rootEl.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
    if (!dir) return;
    e.preventDefault();
    step(dir as 'left' | 'right' | 'up' | 'down');
  });

  // The material samples the background only while it draws, and it draws during
  // a morph. A theme or window-size change moves the background outside those windows.
  if (glass) {
    let idleTimer = 0;
    const restage = (): void => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(refreshBackdrop, 180) as unknown as number;
    };
    window.addEventListener('resize', restage, { passive: true });
    window.addEventListener('scroll', restage, { passive: true });
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', restage);
    } catch {
      /* the old Safari-style API — not critical, the widget lives in Chromium */
    }
  }

  // The panel closes on a click outside and on Escape. Not while downloading: a
  // stray click on the page must not cancel work already under way.
  const closable = (): boolean => mode === 'menu' || mode === 'result';
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!closable()) return;
      if (e.composedPath && e.composedPath().includes(host)) return;
      renderIdle();
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && closable()) renderIdle(true);
  });

  let mountTries = 0;
  /** create() is called before insertion into the document, and a size can only
   *  be measured in a laid-out tree: before insertion it is zero and the panel
   *  collapses. We wait on a timer rather than a frame: in a tab opened in the
   *  background there are no frames at all, and on rAF the widget would not
   *  appear until it was first shown. */
  function firstRender(): void {
    if (host.isConnected) {
      renderIdle();
      refreshBackdrop();
      return;
    }
    if (mountTries++ < 120) setTimeout(firstRender, 32);
  }

  /** The morph: one and the same shape changes size and radius, while the
   *  content cross-fades inside it. */
  function setView(next: HTMLElement, pill: boolean): HTMLElement {
    const { w, h } = measure(next);
    next.classList.add('view');
    next.style.width = w + 'px';

    const previous = view;
    if (previous) {
      previous.classList.add('leaving');
      previous.classList.remove('in');
      setTimeout(() => previous.remove(), 220);
    }
    shell.append(next);
    view = next;

    // The material is computed for the TARGET size before the morph begins:
    // otherwise the panel slides in with the density and map of the old shape and
    // is brought to its senses afterwards — which reads as "wrong first, then it
    // twitched".
    if (glass) {
      const now = shell.getBoundingClientRect();
      // The sheet grows out of the pinned corner — measure the target box from it.
      const left = at[1] === 'l' ? now.left : (now.right || innerWidth - 18) - w;
      const top = at[0] === 't' ? now.top : (now.bottom || innerHeight - 18) - h;
      lastSpread = pageSpread({ left, top, width: w, height: h });
      glass.setSpread(lastSpread);
      refract(w, h, pill ? h / 2 : SHEET_RADIUS);
      // The medium rings when it is reshaped. The impulse starts at the corner
      // the sheet is pinned to, because that is the one place that stays put
      // while everything else travels — in the core's own morph model, the neck
      // between the two shapes.
      glass.ripple(
        at[1] === 'l' ? -w / 2 : w / 2,
        at[0] === 't' ? -h / 2 : h / 2,
      );
    }

    const apply = (): void => {
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

  function renderIdle(focus?: boolean): void {
    settled = true;
    mode = 'idle';
    const fab = document.createElement('button');
    fab.className = 'fab';
    fab.type = 'button';
    fab.title = 'Download this book. Drag to any corner, or Alt+arrows from the keyboard';
    fab.setAttribute('aria-haspopup', 'menu');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = ICON + '<span>Download book</span>';
    fab.addEventListener('click', () => renderMenu());
    setView(fab, true);
    // Escape must not drop focus somewhere in the middle of the page.
    if (focus) fab.focus();
  }

  function renderMenu(): void {
    settled = false;
    mode = 'menu';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const head = document.createElement('div');
    head.className = 'head';
    head.title = 'Drag to move the pane to another corner';
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
      b.addEventListener('click', () => {
        void start(f.id);
      });
      list.append(b);
    }
    // The list is a menu: arrows walk the items instead of scrolling the page under it.
    list.addEventListener('keydown', (e) => {
      if (e.altKey) return;
      const delta = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      const items = [...list.querySelectorAll('button')];
      const i = items.indexOf(shadow.activeElement as HTMLButtonElement);
      items[(i + delta + items.length) % items.length]!.focus();
    });
    panel.append(head, list);
    setView(panel, false);
    const first = list.querySelector('button');
    if (first) first.focus();
  }

  function renderProgress(): { label: HTMLElement; fill: HTMLElement } {
    settled = false;
    mode = 'progress';
    const wrap = document.createElement('div');
    wrap.className = 'pad';
    const label = document.createElement('div');
    label.className = 'label';
    label.setAttribute('role', 'status');
    label.textContent = 'Starting…';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    bar.append(fill);
    const row = document.createElement('div');
    row.className = 'row';
    const cancel = document.createElement('button');
    cancel.className = 'link';
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => {
      if (controller) controller.abort();
      renderIdle(true);
    });
    row.append(cancel);
    wrap.append(label, bar, row);
    setView(wrap, false);
    return { label, fill };
  }

  function renderResult({ error, filename, note }: { error?: string; filename?: string; note?: string }): void {
    settled = true;
    mode = 'result';
    const wrap = document.createElement('div');
    wrap.className = 'pad';
    const msg = document.createElement('div');
    msg.className = error ? 'err' : 'label ok';
    msg.setAttribute('role', 'status');
    msg.textContent = error ? 'Did not work: ' + error : 'Done: ' + filename;
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
    again.textContent = error ? 'Try another format' : 'Download another';
    again.addEventListener('click', () => renderMenu());
    row.append(again);
    wrap.append(msg, row);
    setView(wrap, false);
    // A warning about an incomplete book is not hidden: it has to be seen.
    if (!error && !note) {
      setTimeout(() => {
        if (settled) renderIdle();
      }, 6000);
    }
  }

  async function start(format: Format): Promise<void> {
    const ui = renderProgress();
    controller = new AbortController();
    const progress = (text: string, pct?: number): void => {
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
      const e = err as Error;
      renderResult({ error: e && e.message ? e.message : String(err) });
    } finally {
      controller = null;
    }
  }

  firstRender();
  return {
    host,
    openMenu: renderMenu,
    start,
    moveTo: (next: GlassAnchor) => moveTo(next, true),
    corner: () => at,
  };
}

// The glass under the panel, on top of the `vireglass` package.
//
// The package ships a renderer for exactly this case — `attachGlass` from `vireglass/dom`, glass
// over live DOM — and this file is a port of it, not a second implementation. Every number still
// comes from the package: the displacement map, the rim, the shadow, the body, the backdrop
// reading and the finger springs are all imported. The body and the rim are 3.0's: a body lighter
// than its surround, composed as one translucent layer by `bodyLayer`, and a thin line round the
// whole contour whose strength follows the surround. What differs is only the plumbing, and since
// 2.2.0 taught `attachGlass` to find its own shadow root, two reasons are left:
//
//   the finger — the pane answers a touch by MOVING: it lags behind the finger on the core's pull
//                spring and sinks under a press, and that is a transform on the whole widget,
//                which no material can apply for it. `GlassHandle` hands out neither the spring's
//                state nor a way to drive it, so the deform has to be ours. The gesture is ours
//                for a second reason anyway: on this pane a drag is not a drag of the material but
//                a throw into another corner of the window, and only the widget knows which is
//                which.
//   the shape  — the panel morphs, and `attachGlass` re-reads the backdrop and re-bakes the map at
//                full device resolution on every resize, which during a morph is every frame. Here
//                the map is built once for the shape the pane is travelling to and stretched over
//                the live box until it lands.
//
// The filter also sits on a layer WIDER than the pane (`slack`), which the package has no reason
// to do: Chromium mispositions the layers around a backdrop-filter while the box carrying it is
// being animated. See .refract in ui.ts for that whole story.
import {
  GLASS_SCALE_DEFAULT,
  MATERIAL_RANGES,
  MAX_STRETCH,
  REST_LIGHT,
  VIREGLASS_CONTROL_MATERIAL,
  activeMaterial,
  ambientFrom,
  applyAccessibility,
  applyGlassScale,
  contrastRimLuma,
  createDeform,
  elasticAllowed,
  halfMinDp,
  materialForInk,
  refractionStrength,
  resolveOptics,
  roundedRectGeometry,
  shouldInkBeLight,
  type BackdropSample,
  type VireGlassAccessibility,
  type VireGlassGeometry,
  type VireGlassMaterial,
  type VireGlassOptics,
} from 'vireglass';
import { DISPERSION, TOUCH } from 'vireglass/law';
import {
  RIM_WIDTH_PX,
  bodyLayer,
  boxShadowCss,
  buildDisplacementMap,
  buildSpectralMap,
  cached,
  contrastRimCss,
  hasSpectralEdge,
  probeBackdrop,
  resolveBody,
  rimGradientCss,
  statsFromSamples,
  supportsBackdropFilter,
  supportsSvgBackdropFilter,
  systemAccessibility,
  watchAccessibility,
  withPresence,
} from 'vireglass/dom';

/** The window corner the pane is pinned to. Not the material's business — it lives here because
 *  the corner outlives a visit, and the code that stores it needs the type too. */
export type GlassAnchor = 'br' | 'bl' | 'tr' | 'tl';

/**
 * The pane is a control (hence the thickness, the bevel and the CONTROL material), but it lies
 * over a LIVE page, and such a sheet must not be clear: the chapter text reads through it and
 * argues with the panel's own labels. The cure is not darkening but roughness, taken at the
 * model's ceiling — the sheet material sits at 0.85 and bright patches of page text still push
 * through.
 */
const MATERIAL = materialForInk(
  { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
  true,
);

const SVG_NS = 'http://www.w3.org/2000/svg';
const FILTER_ID = 'vg-refract';

/** The layers the widget already owns. The material writes into them; not one of them is created
 *  here, because their stacking order is the widget's business (see the CSS in ui.ts). */
export interface GlassLayers {
  /** The pane itself: its box is the shape, and the backdrop is read from behind it. */
  shell: HTMLElement;
  /** Wears the `backdrop-filter`. Reaches `slack` past the shell on every side. */
  refract: HTMLElement;
  /** The body of the glass. */
  tint: HTMLElement;
  /** The light that blooms under a finger. */
  glow: HTMLElement;
  /** The hairline. */
  rim: HTMLElement;
}

export interface GlassOptions {
  /** Where the filter goes: `backdrop-filter: url(#…)` used from inside a shadow tree resolves
   *  against that tree, so a filter anywhere else is simply not found. */
  root: ShadowRoot;
  layers: GlassLayers;
  /** How far the refraction layer reaches past the pane, CSS px. */
  slack: number;
}

/** What a finger is doing to the pane right now. The material wears its own share of this; these
 *  are the parts only the widget can apply, because they move the pane as a whole. */
export interface GlassPaint {
  /** Spring offset of the pull, CSS px — the pane lagging behind the finger. */
  pullX: number;
  pullY: number;
  /** How deep the press is, 0…1. */
  press: number;
  /** How active the medium is, 0…1. */
  active: number;
}

/** The pane is always there once it is mounted; the package's `appear` is for glass that is not. */
const APPEAR = 1;

const IDLE: GlassPaint = { pullX: 0, pullY: 0, press: 0, active: 0 };

const to255 = (v: number): number => Math.round(Math.min(Math.max(v, 0), 1) * 255);

export interface GlassSurface {
  /** Read the backdrop again and repaint everything that follows from it: body, rim, shadow, ink
   *  polarity, and the map at full resolution for the shape as it stands. */
  update(): void;
  /** Whether the lettering over the pane should be light. Decided by `update`. */
  ink(): boolean;
  /** One frame of the finger response. */
  frame(): GlassPaint;
  idle(): boolean;
  grab(x: number, y: number): void;
  drag(dx: number, dy: number): void;
  release(): void;
  /** A wave with no finger behind it, for when the pane changes shape by itself. A dense medium
   *  rings when it is reshaped, and the core already knows how that ring looks and how fast it
   *  dies. `grab` and `release` land in one frame, so the press never rises: what is left is the
   *  wave. */
  ripple(x: number, y: number): void;
  /** Build the map for a shape the pane is about to take. It is a raster, so not per frame. */
  reshape(width: number, height: number, radius: number): void;
  /** Follow the box while it travels: the map is stretched over the live size rather than rebuilt.
   *  The field is smooth, so the stretch does not show, and the bevel stays glued to the rim. */
  fit(width: number, height: number): void;
  destroy(): void;
}

export function createGlass({ root, layers, slack }: GlassOptions): GlassSurface {
  if (!supportsBackdropFilter()) throw new Error('no backdrop-filter: the flat panel stands in');
  const { shell, refract, tint, glow, rim } = layers;
  const svgSupported = supportsSvgBackdropFilter();

  let a11y: VireGlassAccessibility = systemAccessibility();
  const deform = createDeform({ elastic: elasticAllowed(a11y) });
  let inkLight = MATERIAL.ink > 0.5;
  let sample = statsFromSamples([]);
  let destroyed = false;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);
  root.append(svg);

  /** Causes to effects, then the user's clarity preference, then accessibility — in that order,
   *  and the order is the package's: a system setting outranks the material. */
  function optics(material: VireGlassMaterial = MATERIAL): VireGlassOptics {
    return applyAccessibility(applyGlassScale(resolveOptics(material), GLASS_SCALE_DEFAULT), a11y);
  }

  function measure(width?: number, height?: number, radius?: number): VireGlassGeometry {
    const rect = shell.getBoundingClientRect();
    const r = radius ?? parseFloat(getComputedStyle(shell).borderTopLeftRadius);
    return roundedRectGeometry(width ?? rect.width, height ?? rect.height, r || 0);
  }

  const dpr = (): number => window.devicePixelRatio || 1;

  // ── The filter ─────────────────────────────────────────────────────────────
  // The graph is the package's `buildFilterElement` with one thing in front of it. There, the
  // filter sits on the glass element itself and the map covers the whole filter region; here it
  // sits on a layer that reaches `slack` further out, so the map is placed at its own offset over
  // a neutral flood. Without the flood the slack would read as zero — a shift of half the scale —
  // and the whole backdrop would slide diagonally out from under the pane.
  let feImage: SVGFEImageElement | null = null;
  let feBlur: SVGFEGaussianBlurElement | null = null;
  /** The displacement passes, and the share of the scale each one takes. With dispersion there are
   *  three, one per channel, each refracting at its own index. */
  let passes: Array<{ node: SVGElement; ratio: number }> = [];
  let graphFor = '';
  let wornScale = -1;
  let wornBlur = -1;

  function buildGraph(o: VireGlassOptics, geometry: VireGlassGeometry): void {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', FILTER_ID);
    filter.setAttribute('filterUnits', 'objectBoundingBox');
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '1');
    filter.setAttribute('height', '1');
    // The spec's default is linearRGB: the browser would gamma-linearise the map's bytes before
    // reading them, 128 would stop meaning "no shift", and the flat middle of the pane would drift
    // by several pixels.
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const flood = document.createElementNS(SVG_NS, 'feFlood');
    flood.setAttribute('flood-color', 'rgb(128,128,128)');
    flood.setAttribute('result', 'flat');
    feImage = document.createElementNS(SVG_NS, 'feImage');
    feImage.setAttribute('preserveAspectRatio', 'none');
    feImage.setAttribute('result', 'shape');
    const merge = document.createElementNS(SVG_NS, 'feMerge');
    merge.setAttribute('result', 'map');
    for (const src of ['flat', 'shape']) {
      const node = document.createElementNS(SVG_NS, 'feMergeNode');
      node.setAttribute('in', src);
      merge.append(node);
    }
    // Scattering first, displacement second: in frosted glass the light scatters inside the body
    // and there is nothing sharp left to refract afterwards. The other way round, the rim drags
    // still-sharp page text under the pane and it reads as dirty smears. The package calls the
    // same step prefiltering, and does it for the same reason.
    feBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    feBlur.setAttribute('in', 'SourceGraphic');
    feBlur.setAttribute('stdDeviation', String(Math.max(o.blur, 0)));
    feBlur.setAttribute('result', 'blurred');
    filter.append(flood, feImage, merge, feBlur);

    passes = [];
    // DISPERSION: the channels refract at different indices — red below the base index, blue
    // above it, green at it. One pass cannot do that, so each channel gets its own and the three
    // are summed back together.
    //
    // Only when they actually come out apart, though. `refractionStrength` saturates at n = 1.6
    // and this material sits at 1.69, so the shifted indices land on the same full strength and
    // all three channels ask for the same scale — three displacement passes, two composites and
    // three colour matrices, per frame, to produce the single-pass picture exactly.
    const base = refractionStrength(o.ior);
    const ratio = (shift: number): number =>
      base > 0 ? refractionStrength(o.ior + shift) / base : 1;
    const red = ratio(DISPERSION.redShift * o.iorSpread);
    const blue = ratio(DISPERSION.blueShift * o.iorSpread);
    const disperses = Math.abs(red - 1) > 1e-4 || Math.abs(blue - 1) > 1e-4;
    if (disperses) {
      const channels: Array<[string, number, string]> = [
        ['dR', red, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'],
        ['dG', 1, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'],
        ['dB', blue, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'],
      ];
      for (const [name, share, matrix] of channels) {
        const pass = document.createElementNS(SVG_NS, 'feDisplacementMap');
        pass.setAttribute('in', 'blurred');
        pass.setAttribute('in2', 'map');
        pass.setAttribute('xChannelSelector', 'R');
        pass.setAttribute('yChannelSelector', 'G');
        pass.setAttribute('result', `${name}raw`);
        const only = document.createElementNS(SVG_NS, 'feColorMatrix');
        only.setAttribute('in', `${name}raw`);
        only.setAttribute('type', 'matrix');
        only.setAttribute('values', matrix);
        only.setAttribute('result', name);
        filter.append(pass, only);
        passes.push({ node: pass, ratio: share });
      }
      // Arithmetic add, not a blend: every channel is isolated, so the sum is the colour back again.
      const rg = document.createElementNS(SVG_NS, 'feComposite');
      const rgb = document.createElementNS(SVG_NS, 'feComposite');
      for (const [node, a, b, out] of [
        [rg, 'dR', 'dG', 'dRG'],
        [rgb, 'dRG', 'dB', 'refracted'],
      ] as const) {
        node.setAttribute('in', a);
        node.setAttribute('in2', b);
        node.setAttribute('operator', 'arithmetic');
        node.setAttribute('k1', '0');
        node.setAttribute('k2', '1');
        node.setAttribute('k3', '1');
        node.setAttribute('k4', '0');
        node.setAttribute('result', out);
      }
      filter.append(rg, rgb);
    } else {
      const pass = document.createElementNS(SVG_NS, 'feDisplacementMap');
      pass.setAttribute('in', 'blurred');
      pass.setAttribute('in2', 'map');
      pass.setAttribute('xChannelSelector', 'R');
      pass.setAttribute('yChannelSelector', 'G');
      pass.setAttribute('result', 'refracted');
      filter.append(pass);
      passes.push({ node: pass, ratio: 1 });
    }

    // The spectral edge: a filter graph cannot evaluate a function per pixel, but it can multiply
    // by an image, so diffraction and interference are baked into one and composited in.
    if (hasSpectralEdge(o)) {
      const key = `${geometry.width}x${geometry.height}r${geometry.cornerRadius}@${dpr()}`;
      const spectral = cached(`h|${key}`, () => buildSpectralMap(o, geometry, dpr()));
      const image = document.createElementNS(SVG_NS, 'feImage');
      image.setAttribute('href', spectral.url);
      image.setAttribute('preserveAspectRatio', 'none');
      image.setAttribute('result', 'hue');
      const product = document.createElementNS(SVG_NS, 'feComposite');
      product.setAttribute('in', 'refracted');
      product.setAttribute('in2', 'hue');
      product.setAttribute('operator', 'arithmetic');
      product.setAttribute('k1', String(spectral.headroom));
      product.setAttribute('k2', '0');
      product.setAttribute('k3', '0');
      product.setAttribute('k4', '0');
      filter.append(image, product);
    }

    defs.replaceChildren(filter);
    wornScale = -1;
    wornBlur = -1;
  }

  /** The two numbers the live material writes into the graph every frame. An attribute write
   *  invalidates the filter, so both are compared first: re-running a displacement over the whole
   *  backdrop at 60 Hz for no change is the one thing here expensive enough to notice. */
  function wear(scale: number, blur: number): void {
    if (Math.abs(scale - wornScale) > 0.05) {
      wornScale = scale;
      for (const pass of passes) pass.node.setAttribute('scale', (scale * pass.ratio).toFixed(2));
    }
    if (feBlur && Math.abs(blur - wornBlur) > 0.05) {
      wornBlur = blur;
      feBlur.setAttribute('stdDeviation', blur.toFixed(2));
    }
  }

  function fit(width: number, height: number): void {
    if (!feImage) return;
    feImage.setAttribute('x', String(slack));
    feImage.setAttribute('y', String(slack));
    feImage.setAttribute('width', String(width));
    feImage.setAttribute('height', String(height));
  }

  function reshape(width: number, height: number, radius: number): void {
    if (!svgSupported) return;
    const o = optics();
    const geometry = measure(width, height, radius);
    const key = `${geometry.width}x${geometry.height}r${geometry.cornerRadius}@${dpr()}:${o.blur}:${o.refraction}`;
    if (key !== graphFor || !feImage) {
      buildGraph(o, geometry);
      graphFor = key;
    }
    const map = cached(`d|${key}`, () => buildDisplacementMap(o, geometry, dpr()));
    feImage!.setAttribute('href', map.url);
    fit(geometry.width, geometry.height);
    wear(map.scale, o.blur);
    refract.style.setProperty('backdrop-filter', `url(#${FILTER_ID})`);
    refract.style.setProperty('-webkit-backdrop-filter', `url(#${FILTER_ID})`);
  }

  // ── Everything the backdrop decides ────────────────────────────────────────

  function paintGlow(x: number, y: number, strength: number, geometry: VireGlassGeometry): void {
    if (strength <= 0.001) {
      glow.style.setProperty('--vireglass-glow-opacity', '0');
      return;
    }
    // The glow is a CONCENTRATION of the surroundings, not the glass's own whiteness: over a dark
    // page the pane lightens but never turns white, and the ink over it stays legible.
    const [r, g, b] = ambientFrom(sample);
    const cx = ((x + geometry.width / 2) / Math.max(geometry.width, 1)) * 100;
    const cy = ((y + geometry.height / 2) / Math.max(geometry.height, 1)) * 100;
    const reach = halfMinDp(geometry) * TOUCH.radiusOfHalfSize;
    glow.style.setProperty(
      '--vireglass-glow',
      `radial-gradient(circle ${reach.toFixed(0)}px at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, ` +
        `rgba(${to255(r)},${to255(g)},${to255(b)},1) 0%, rgba(${to255(r)},${to255(g)},${to255(b)},0) 100%)`,
    );
    glow.style.setProperty('--vireglass-glow-opacity', strength.toFixed(3));
  }

  function update(): void {
    if (destroyed) return;
    const o = optics();
    const geometry = measure();
    sample = probeBackdrop(shell);

    // Ink polarity, decided by the package, which keeps the hysteresis inside it: the flip to dark
    // and the way back sit far enough apart that a cover passing under the edge does not recolour
    // the panel. The package also offers CONFIRMATIONS on top of that, and it is deliberately not
    // used here — it counts readings, and it is sized for a renderer that takes them about five
    // times a second. This one reads on events instead: once at mount, then when a scroll stops
    // or the pane lands. Three of those can be a minute apart, and the panel would spend it
    // wearing the polarity of wherever it was first put down.
    inkLight = shouldInkBeLight(sample, inkLight);
    const polarity = inkLight ? 1 : 0;

    // The body is one translucent layer composed from the lens's own chain, and it is lighter than
    // its surround on every backdrop. `o` is the optics before `appear`, which `bodyLayer` applies
    // itself: scaling both would count it twice.
    const [ar, ag, ab] = ambientFrom(sample);
    const layer = bodyLayer(o, sample, polarity, [ar, ag, ab], APPEAR);
    tint.style.setProperty(
      '--vireglass-body-color',
      `rgba(${to255(layer.r)}, ${to255(layer.g)}, ${to255(layer.b)}, ${layer.alpha.toFixed(3)})`,
    );
    // Increased contrast measures its border from the body, not from the surroundings.
    const pole = withPresence(resolveBody(o, sample, polarity), o, sample).tintLuma;

    // Rim and shadow follow the SAMPLE and not just the shape: the surroundings they take their
    // colour and their density from move under a scroll while the silhouette stays still.
    rim.style.setProperty(
      '--vireglass-rim',
      a11y.increaseContrast
        ? contrastRimCss(pole, contrastRimLuma(pole), APPEAR)
        : rimGradientCss(o, [ar, ag, ab], REST_LIGHT, APPEAR),
    );
    rim.style.setProperty('--vireglass-rim-width', `${RIM_WIDTH_PX}px`);
    shell.style.boxShadow = boxShadowCss(geometry, sample, APPEAR);

    if (svgSupported) {
      reshape(geometry.width, geometry.height, geometry.cornerRadius);
      return;
    }
    // No filter reference inside `backdrop-filter` — Firefox, older Safari. A real path and not a
    // stub: blur and saturation stand in for what refraction does optically, and the body above
    // carries what they cannot.
    const stand = `blur(${Math.max(o.blur, 1.5).toFixed(1)}px) saturate(${(1 + o.colorPickup).toFixed(2)})`;
    refract.style.setProperty('backdrop-filter', stand);
    refract.style.setProperty('-webkit-backdrop-filter', stand);
  }

  const stopWatching = watchAccessibility((next) => {
    a11y = next;
    deform.setElastic(elasticAllowed(next));
    graphFor = '';
    update();
  });

  // ── The finger ─────────────────────────────────────────────────────────────

  let last = 0;
  const waveImpulse = (g: VireGlassGeometry): number =>
    halfMinDp(g) * MAX_STRETCH * TOUCH.waveOfTravel;

  function frame(): GlassPaint {
    if (destroyed) return IDLE;
    const now = performance.now();
    deform.step(last ? Math.min((now - last) / 1000, 0.25) : 0);
    last = now;
    const d = deform.sample();
    const geometry = measure();
    const settled = deform.idle();
    // An active medium is a denser, cleaner one — see below for why this and not `raiseIntoGlass`.
    const live = settled ? optics() : optics(activeMaterial(MATERIAL, d.active));

    if (svgSupported && feImage && !settled) {
      // An active medium is a denser, cleaner one: a higher index, a thicker body, a wider bevel,
      // less roughness — so under the finger the pane bends harder and the haze thins. Not
      // `raiseIntoGlass`, which the package's own renderer uses here: that one is for a control
      // which is NOT glass at rest and materialises into it, and it takes roughness to nothing at
      // a full press. This pane is glass already, and it is lying over a page of text: clear it
      // completely and the chapter comes through sharp behind the panel's own labels.
      //
      // The map is rebuilt at one device pixel per CSS pixel while this lasts — `feImage`
      // stretches it over the layer anyway, and a full-resolution rebuild plus a PNG encode every
      // frame does not hold a frame budget.
      const map = buildDisplacementMap(live, geometry, 1, {
        touch: {
          x: d.touchX,
          y: d.touchY,
          pullX: d.pullX,
          pullY: d.pullY,
          press: d.press,
          radius: halfMinDp(geometry) * TOUCH.radiusOfHalfSize,
          waveAmp: d.waveAmp,
          wavePhase: d.wavePhase,
        },
      });
      feImage.setAttribute('href', map.url);
      wear(map.scale, live.blur);
      // The settled map is a different raster at a different resolution: it has to be laid down
      // again once the pane comes to rest.
      graphFor = '';
    }

    paintGlow(d.touchX, d.touchY, d.active * live.edgeLight, geometry);
    return { pullX: d.pullX, pullY: d.pullY, press: d.press, active: d.active };
  }

  return {
    update,
    ink: () => inkLight,
    frame,
    idle: () => deform.idle(),
    grab: (x, y) => deform.grab(x, y, waveImpulse(measure())),
    drag: (dx, dy) => deform.drag(dx, dy, halfMinDp(measure()) * MAX_STRETCH),
    release: () => deform.release(waveImpulse(measure()) * TOUCH.releaseWave),
    ripple(x, y) {
      deform.grab(x, y, waveImpulse(measure()));
      deform.release(0);
    },
    reshape,
    fit,
    destroy() {
      destroyed = true;
      stopWatching();
      svg.remove();
      // The filter goes with the <svg>, so the reference has to go with it: left behind, it is a
      // `url(#…)` pointing at nothing, and the layer wearing it keeps a compositor pass for it.
      refract.style.removeProperty('backdrop-filter');
      refract.style.removeProperty('-webkit-backdrop-filter');
    },
  };
}

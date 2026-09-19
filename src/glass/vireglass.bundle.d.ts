// Types for the generated vireglass.bundle.js. Hand-written and deliberately
// narrow: this is the whole surface the extension uses, and keeping it here
// means the bundle can be regenerated without touching type declarations.
//
// The implementation lives in entry.ts — keep the two in step.

export type GlassAnchor = 'br' | 'bl' | 'tr' | 'tl';

export interface Refraction {
  /** A data: URL of the displacement map, for feImage. */
  map: string;
  /** How far feDisplacementMap should shift samples, in CSS pixels. */
  scale: number;
  /** Scattering radius of the material, in CSS pixels. */
  blur: number;
}

export interface GlassPaint {
  /** Whether the lettering over the pane should be light. */
  inkLight: boolean;
  /** The adaptive body, ready to drop into a CSS background. */
  body: string;
  /** Scattering radius of the medium right now, CSS px — drops under a press. */
  blur: number;
  /** How far the rim bends a ray right now, CSS px — grows under a press. */
  refract: number;
  /** Spring offset of the pull, CSS px. */
  pullX: number;
  pullY: number;
  /** How deep the press is, 0…1. */
  press: number;
  /** How active the medium is, 0…1. */
  active: number;
  /** Where the finger is, relative to the centre of the pane, CSS px. */
  touchX: number;
  touchY: number;
  /** How wide the contact spot is, CSS px. */
  touchRadius: number;
}

export interface GlassSurface {
  /** How far the canvas reaches past the pane on every side. */
  readonly pad: number;
  setBackdropColor(color: string): void;
  setSpread(value: number): void;
  settled(): boolean;
  grab(x: number, y: number): void;
  drag(dx: number, dy: number): void;
  release(): void;
  idle(): boolean;
  /** A wave with no finger behind it, for a shape change. */
  ripple(x: number, y: number, strength?: number): void;
  refraction(width: number, height: number, cornerRadius: number): Refraction;
  draw(width: number, height: number, cornerRadius: number, anchor?: GlassAnchor): GlassPaint;
  probe(): { stats: unknown; inkLight: boolean; backdrop: string };
  destroy(): void;
}

export function createGlassSurface(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
): GlassSurface;

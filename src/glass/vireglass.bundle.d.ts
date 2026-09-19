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

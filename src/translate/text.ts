// Pure helpers around the text an engine is handed: where to cut it, how to
// group it into requests, and what to tidy in what comes back.

const VOID = new Set(['br', 'hr', 'img']);
const SENTENCE_END = /[.!?…。！？]["'»”’)\]」』]*\s+/g;

/**
 * Cuts an over-long fragment at sentence ends and <br>, but only where no inline
 * tag is open: a cut inside <i>…</i> would hand the engine two broken halves.
 * A stretch with no such place is left whole — a long request beats a mangled one.
 */
export function splitSegment(html: string, budget: number): string[] {
  if (html.length <= budget) return [html];

  const atoms: string[] = [];
  let cur = '';
  let depth = 0;
  for (const token of html.match(/<[^>]*>|[^<]+/g) ?? []) {
    if (token.startsWith('<')) {
      const m = /^<(\/?)([a-z0-9]+)/i.exec(token);
      const name = m ? m[2]!.toLowerCase() : '';
      cur += token;
      if (m && !VOID.has(name) && !token.endsWith('/>')) depth = Math.max(0, depth + (m[1] ? -1 : 1));
      else if (name === 'br' && depth === 0) {
        atoms.push(cur);
        cur = '';
      }
      continue;
    }
    if (depth > 0) {
      cur += token;
      continue;
    }
    let from = 0;
    for (const m of token.matchAll(SENTENCE_END)) {
      const end = m.index + m[0].length;
      atoms.push(cur + token.slice(from, end));
      cur = '';
      from = end;
    }
    cur += token.slice(from);
  }
  if (cur) atoms.push(cur);

  const pieces: string[] = [];
  let piece = '';
  for (const atom of atoms) {
    if (piece && piece.length + atom.length > budget) {
      pieces.push(piece);
      piece = '';
    }
    piece += atom;
  }
  if (piece) pieces.push(piece);
  return pieces;
}

/** Puts translated pieces of one fragment back together. */
export function joinPieces(pieces: string[]): string {
  let out = '';
  for (const piece of pieces) {
    if (!out) out = piece;
    else if (/<br\s*\/?>\s*$/i.test(out)) out += piece;
    else out = `${out.replace(/\s+$/, '')} ${piece.replace(/^\s+/, '')}`;
  }
  return out;
}

/** Groups pieces into requests: indices into `pieces`, each group under the budget and the cap. */
export function planBatches(pieces: string[], budget: number, maxSegments: number): number[][] {
  const groups: number[][] = [];
  let group: number[] = [];
  let size = 0;
  pieces.forEach((piece, i) => {
    if (group.length && (group.length >= maxSegments || size + piece.length > budget)) {
      groups.push(group);
      group = [];
      size = 0;
    }
    group.push(i);
    size += piece.length;
  });
  if (group.length) groups.push(group);
  return groups;
}

// The engine leaves a space before punctuation that follows a closing inline
// tag ("</b> ."). Only that case is touched, so ordinary spaces survive.
const STRAY = /(<\/[a-z0-9]+>) +(?=[.,…)\]}。、！？；：」』!?;:»”’])/gi;
// French sets these off with a space on purpose.
const STRAY_FRENCH = /(<\/[a-z0-9]+>) +(?=[.,…)\]}])/gi;

export function normalizeSpacing(html: string, target: string): string {
  return html.replace(target.toLowerCase().startsWith('fr') ? STRAY_FRENCH : STRAY, '$1');
}

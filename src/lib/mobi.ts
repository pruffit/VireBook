// MOBI6 (PalmDB + PalmDOC + EXTH) — the format you side-load onto a Kindle by USB.
// Navigation in MOBI6 hangs not on #anchors but on filepos: a byte offset into
// the uncompressed text. So the markup is assembled in two passes — first with
// fixed-width placeholders, then those are replaced by offsets (the length does
// not change, so the offsets stay true).
import type { Book } from '../types.ts';
import { escapeText } from './html.ts';

const RECORD_SIZE = 4096;
const enc = new TextEncoder();
const esc = (s: unknown): string => escapeText(String(s == null ? '' : s));

class Writer {
  buf: Uint8Array;
  private view: DataView;
  pos = 0;

  constructor(size: number) {
    this.buf = new Uint8Array(size);
    this.view = new DataView(this.buf.buffer);
  }

  u8(v: number): this {
    this.view.setUint8(this.pos, v);
    this.pos += 1;
    return this;
  }

  u16(v: number): this {
    this.view.setUint16(this.pos, v >>> 0, false);
    this.pos += 2;
    return this;
  }

  u32(v: number): this {
    this.view.setUint32(this.pos, v >>> 0, false);
    this.pos += 4;
    return this;
  }

  bytes(b: Uint8Array): this {
    this.buf.set(b, this.pos);
    this.pos += b.length;
    return this;
  }

  ascii(s: string, width?: number): this {
    const b = enc.encode(s);
    const n = width == null ? b.length : Math.min(b.length, width);
    this.buf.set(b.subarray(0, n), this.pos);
    this.pos += width == null ? n : width;
    return this;
  }

  zeros(n: number): this {
    this.pos += n;
    return this;
  }

  at(p: number): this {
    this.pos = p;
    return this;
  }
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  const first = needle[0];
  const limit = haystack.length - needle.length;
  outer: for (let i = from; i <= limit; i += 1) {
    if (haystack[i] !== first) continue;
    for (let j = 1; j < needle.length; j += 1) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** PalmDOC LZ77. Matches are found through a hash chain — scanning all 2047
 *  offsets at every position turns assembling a book into minutes. */
export function palmDocCompress(chunk: Uint8Array): Uint8Array {
  const n = chunk.length;
  const out = new Uint8Array(n * 2 + 16);
  let o = 0;
  const head = new Map<number, number>();
  const prev = new Int32Array(n).fill(-1);

  const key = (i: number): number => (chunk[i]! << 16) | (chunk[i + 1]! << 8) | chunk[i + 2]!;

  let i = 0;
  while (i < n) {
    let bestLen = 0;
    let bestDist = 0;

    if (i + 2 < n) {
      const k = key(i);
      let cand = head.has(k) ? head.get(k)! : -1;
      const maxLen = Math.min(10, n - i);
      let guard = 0;
      while (cand >= 0 && guard++ < 64) {
        const dist = i - cand;
        if (dist > 2047) break;
        let len = 0;
        while (len < maxLen && chunk[cand + len] === chunk[i + len]) len += 1;
        if (len > bestLen) {
          bestLen = len;
          bestDist = dist;
          if (len === maxLen) break;
        }
        cand = prev[cand]!;
      }
    }

    if (bestLen >= 3) {
      for (let k = 0; k < bestLen; k += 1) {
        const p = i + k;
        if (p + 2 < n) {
          const h = key(p);
          prev[p] = head.has(h) ? head.get(h)! : -1;
          head.set(h, p);
        }
      }
      const m = 0x8000 | ((bestDist << 3) & 0x3ff8) | (bestLen - 3);
      out[o++] = (m >> 8) & 0xff;
      out[o++] = m & 0xff;
      i += bestLen;
      continue;
    }

    if (i + 2 < n) {
      const h = key(i);
      prev[i] = head.has(h) ? head.get(h)! : -1;
      head.set(h, i);
    }

    const b = chunk[i]!;
    if (b === 0x20 && i + 1 < n && chunk[i + 1]! >= 0x40 && chunk[i + 1]! <= 0x7f) {
      out[o++] = chunk[i + 1]! ^ 0x80;
      i += 2;
      continue;
    }
    if (b === 0 || (b >= 0x09 && b <= 0x7f)) {
      out[o++] = b;
      i += 1;
      continue;
    }
    // Cyrillic in UTF-8 is all bytes >= 0x80 and each one needs escaping.
    // Pack them in runs of up to eight: 9 bytes for 8 instead of 16.
    let run = 0;
    while (i + run < n && run < 8) {
      const c = chunk[i + run]!;
      if (c === 0 || (c >= 0x09 && c <= 0x7f)) break;
      run += 1;
    }
    out[o++] = run;
    for (let k = 0; k < run; k += 1) out[o++] = chunk[i + k]!;
    i += run;
  }
  return out.subarray(0, o);
}

export function buildHtml(book: Book): string {
  const chapters = book.chapters || [];
  const parts: string[] = [];
  parts.push('<html><head>');
  parts.push('<guide><reference type="toc" title="Contents" filepos=FPOSTOC001 /></guide>');
  parts.push('</head><body>');

  parts.push('<a name="vbstart"></a>');
  parts.push(`<h1 align="center">${esc(book.title)}</h1>`);
  parts.push(`<p align="center"><i>${esc(book.author || 'Unknown author')}</i></p>`);
  if (book.summaryText) {
    parts.push(`<blockquote><p><i>${esc(book.summaryText)}</i></p></blockquote>`);
  }
  const meta: [string, string | undefined][] = [
    ['Fandom', book.fandom],
    ['Pairing', book.pairing],
    ['Rating', book.rating],
    ['Status', book.status],
    ['Tags', (book.tags || []).join(', ')],
  ];
  for (const [k, v] of meta) {
    if (v) parts.push(`<p><small><b>${esc(k)}:</b> ${esc(v)}</small></p>`);
  }
  if (book.sourceUrl) parts.push(`<p><small>Source: ${esc(book.sourceUrl)}</small></p>`);

  parts.push('<mbp:pagebreak/>');
  parts.push('<a name="vbtoc"></a>');
  parts.push('<h1>Contents</h1>');
  chapters.forEach((c, i) => {
    parts.push(`<p><a filepos=FPOSC${String(i + 1).padStart(5, '0')}>${esc(c.title)}</a></p>`);
  });

  chapters.forEach((c, i) => {
    parts.push('<mbp:pagebreak/>');
    parts.push(`<a name="vbc${String(i + 1).padStart(5, '0')}"></a>`);
    parts.push(`<h2>${esc(c.title)}</h2>`);
    parts.push(mobifyXhtml(c.xhtml));
    if (c.notesXhtml) parts.push(`<hr/><small>${mobifyXhtml(c.notesXhtml)}</small>`);
  });

  parts.push('</body></html>');
  return parts.join('\n');
}

// MOBI6 is HTML 3.2, not XHTML: the old Kindle renderer shows self-closing tags
// and unknown attributes as literal text.
function mobifyXhtml(xhtml: string): string {
  return String(xhtml || '')
    .replace(/<br\s*\/>/g, '<br>')
    .replace(/<hr\s*\/>/g, '<hr>')
    .replace(/<img([^>]*?)\/>/g, '<img$1>')
    .replace(/<\/?(section|article|figure|figcaption|mark|ins|del)>/g, '')
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '');
}

export function patchFilepos(html: string, chapterCount: number): Uint8Array {
  const bytes = enc.encode(html);
  const offsetOf = (anchorName: string): number => {
    const needle = enc.encode(`<a name="${anchorName}">`);
    const at = indexOfBytes(bytes, needle);
    return at < 0 ? 0 : at;
  };

  const targets: [string, number][] = [['FPOSTOC001', offsetOf('vbtoc')]];
  for (let i = 1; i <= chapterCount; i += 1) {
    targets.push([`FPOSC${String(i).padStart(5, '0')}`, offsetOf(`vbc${String(i).padStart(5, '0')}`)]);
  }

  for (const [token, offset] of targets) {
    const needle = enc.encode(token);
    const at = indexOfBytes(bytes, needle);
    if (at < 0) continue;
    const digits = enc.encode(String(offset).padStart(10, '0'));
    bytes.set(digits, at);
  }
  return bytes;
}

function exthHeader(book: Book): Uint8Array {
  const records: { type: number; data: Uint8Array }[] = [];
  const add = (type: number, value: string | undefined): void => {
    if (!value) return;
    records.push({ type, data: enc.encode(String(value)) });
  };
  add(100, book.author || 'Unknown author');
  add(101, book.siteName || 'VireBook');
  add(103, (book.summaryText || '').slice(0, 1800));
  add(105, (book.tags || []).slice(0, 12).join(', '));
  add(109, book.sourceUrl || '');
  add(503, book.title);
  add(501, 'EBOK');

  let size = 12;
  for (const r of records) size += 8 + r.data.length;
  const padding = (4 - (size % 4)) % 4;
  const total = size + padding;

  const w = new Writer(total);
  w.ascii('EXTH');
  w.u32(total);
  w.u32(records.length);
  for (const r of records) {
    w.u32(r.type);
    w.u32(8 + r.data.length);
    w.bytes(r.data);
  }
  return w.buf;
}

function flisRecord(): Uint8Array {
  const w = new Writer(36);
  w.ascii('FLIS').u32(8).u16(65).u16(0).u32(0).u32(0xffffffff).u16(1).u16(3).u32(3).u32(1).u32(0xffffffff);
  return w.buf;
}

function fcisRecord(textLength: number): Uint8Array {
  const w = new Writer(44);
  w.ascii('FCIS').u32(20).u32(16).u32(1).u32(0).u32(textLength).u32(0).u32(32).u32(8).u16(1).u16(1).u32(0);
  return w.buf;
}

export function build(book: Book): Blob {
  const chapters = book.chapters || [];
  const textBytes = patchFilepos(buildHtml(book), chapters.length);

  const textRecords: Uint8Array[] = [];
  for (let off = 0; off < textBytes.length; off += RECORD_SIZE) {
    textRecords.push(
      palmDocCompress(textBytes.subarray(off, Math.min(off + RECORD_SIZE, textBytes.length))),
    );
  }
  if (!textRecords.length) textRecords.push(new Uint8Array([0]));

  const lastText = textRecords.length; // text records: 1..N
  const flisNum = lastText + 1;
  const fcisNum = lastText + 2;

  const exth = exthHeader(book);
  const titleBytes = enc.encode(book.title || 'Book');
  const mobiHeaderLength = 232;
  const fullNameOffset = 16 + mobiHeaderLength + exth.length;
  const record0Raw = fullNameOffset + titleBytes.length + 2;
  const record0Size = record0Raw + ((4 - (record0Raw % 4)) % 4);

  const r0 = new Writer(record0Size);
  // PalmDOC header
  r0.u16(2).u16(0).u32(textBytes.length).u16(textRecords.length).u16(RECORD_SIZE).u16(0).u16(0);
  // MOBI header
  r0.ascii('MOBI');
  r0.u32(mobiHeaderLength);
  r0.u32(2);
  r0.u32(65001);
  r0.u32((Math.random() * 0xfffffff) >>> 0);
  r0.u32(6);
  for (let i = 0; i < 10; i += 1) r0.u32(0xffffffff);
  r0.u32(flisNum); // first non-book index
  r0.u32(fullNameOffset);
  r0.u32(titleBytes.length);
  r0.u32(book.language === 'ru' ? 0x19 : 0x09);
  r0.u32(0);
  r0.u32(0);
  r0.u32(6);
  r0.u32(flisNum); // first image index
  r0.u32(0).u32(0).u32(0).u32(0);
  r0.u32(0x40); // EXTH present
  r0.zeros(32);
  r0.u32(0xffffffff);
  r0.u32(0xffffffff).u32(0).u32(0).u32(0);
  r0.zeros(8);
  r0.u16(1);
  r0.u16(lastText);
  r0.u32(1);
  r0.u32(fcisNum).u32(1);
  r0.u32(flisNum).u32(1);
  r0.zeros(8);
  r0.u32(0xffffffff);
  r0.u32(0);
  r0.u32(0xffffffff);
  r0.u32(0xffffffff);
  r0.u32(0); // extra record data flags: records carry no trailers
  r0.u32(0xffffffff);
  r0.at(16 + mobiHeaderLength).bytes(exth);
  r0.at(fullNameOffset).bytes(titleBytes);

  const records = [
    r0.buf,
    ...textRecords,
    flisRecord(),
    fcisRecord(textBytes.length),
    new Uint8Array([0xe9, 0x8e, 0x0d, 0x0a]),
  ];

  const headerSize = 78 + records.length * 8 + 2;
  const header = new Writer(headerSize);
  const dbName = (book.title || 'book').replace(/[^\x20-\x7e]/g, '_').slice(0, 31);
  header.ascii(dbName, 32);
  header.u16(0).u16(0);
  const palmEpoch = Math.floor(Date.now() / 1000) + 2082844800; // Palm counts from 1904
  header.u32(palmEpoch).u32(palmEpoch).u32(0).u32(0).u32(0).u32(0);
  header.ascii('BOOK').ascii('MOBI');
  header.u32((Math.random() * 0xfffffff) >>> 0).u32(0);
  header.u16(records.length);

  let offset = headerSize;
  for (let i = 0; i < records.length; i += 1) {
    header.u32(offset);
    header.u8(0);
    header.u8(0).u8((i >> 8) & 0xff).u8(i & 0xff);
    offset += records[i]!.length;
  }
  header.u16(0);

  return new Blob([header.buf, ...records] as BlobPart[], {
    type: 'application/x-mobipocket-ebook',
  });
}

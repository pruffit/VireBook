// ZIP writer: ровно столько, сколько нужно EPUB (store + deflate-raw).
(function (root, factory) {
  const VireBook = (root.VireBook = root.VireBook || {});
  factory(VireBook);
  if (typeof module !== 'undefined' && module.exports) module.exports = VireBook;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (VireBook) {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  const enc = new TextEncoder();
  const toBytes = (v) => (typeof v === 'string' ? enc.encode(v) : v);

  async function deflateRaw(bytes) {
    if (typeof CompressionStream === 'undefined') return null;
    try {
      const cs = new CompressionStream('deflate-raw');
      const stream = new Blob([bytes]).stream().pipeThrough(cs);
      const buf = await new Response(stream).arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      return null;
    }
  }

  // DOS-время: у EPUB оно ни на что не влияет, но нули ломают некоторые читалки.
  function dosDateTime(date) {
    const y = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
      date: ((y - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  class ByteSink {
    constructor() {
      this.parts = [];
      this.length = 0;
    }
    push(bytes) {
      this.parts.push(bytes);
      this.length += bytes.length;
    }
    u16(v) {
      const b = new Uint8Array(2);
      new DataView(b.buffer).setUint16(0, v, true);
      this.push(b);
    }
    u32(v) {
      const b = new Uint8Array(4);
      new DataView(b.buffer).setUint32(0, v >>> 0, true);
      this.push(b);
    }
    blob(type) {
      return new Blob(this.parts, { type });
    }
  }

  /**
   * files: [{ name, data: string|Uint8Array, store?: boolean }]
   * Первый файл EPUB (mimetype) обязан идти без сжатия и без extra-полей.
   */
  async function zip(files, { mimetype = 'application/zip', date = new Date() } = {}) {
    const stamp = dosDateTime(date);
    const out = new ByteSink();
    const central = [];

    for (const file of files) {
      const nameBytes = enc.encode(file.name);
      const raw = toBytes(file.data);
      const crc = crc32(raw);

      let method = 0;
      let payload = raw;
      if (!file.store) {
        const packed = await deflateRaw(raw);
        if (packed && packed.length < raw.length) {
          method = 8;
          payload = packed;
        }
      }

      const offset = out.length;
      out.push(enc.encode('PK\x03\x04'));
      out.u16(method === 8 ? 20 : 10); // версия, нужная для распаковки
      out.u16(0);
      out.u16(method);
      out.u16(stamp.time);
      out.u16(stamp.date);
      out.u32(crc);
      out.u32(payload.length);
      out.u32(raw.length);
      out.u16(nameBytes.length);
      out.u16(0);
      out.push(nameBytes);
      out.push(payload);

      central.push({ nameBytes, method, crc, packed: payload.length, raw: raw.length, offset });
    }

    const centralStart = out.length;
    for (const e of central) {
      out.push(enc.encode('PK\x01\x02'));
      out.u16(0x031e); // создано под Unix — иначе часть читалок теряет права
      out.u16(e.method === 8 ? 20 : 10);
      out.u16(0);
      out.u16(e.method);
      out.u16(stamp.time);
      out.u16(stamp.date);
      out.u32(e.crc);
      out.u32(e.packed);
      out.u32(e.raw);
      out.u16(e.nameBytes.length);
      out.u16(0);
      out.u16(0);
      out.u16(0);
      out.u16(0);
      out.u32(0);
      out.u32(e.offset);
      out.push(e.nameBytes);
    }
    const centralSize = out.length - centralStart;

    out.push(enc.encode('PK\x05\x06'));
    out.u16(0);
    out.u16(0);
    out.u16(central.length);
    out.u16(central.length);
    out.u32(centralSize);
    out.u32(centralStart);
    out.u16(0);

    return out.blob(mimetype);
  }

  VireBook.zip = zip;
  VireBook.crc32 = crc32;
  return VireBook;
});

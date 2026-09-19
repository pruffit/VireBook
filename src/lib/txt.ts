// Plain text — the format that works when nothing else does.
import type { Book } from '../types.ts';

export function stripTags(xhtml: string): string {
  return String(xhtml || '')
    .replace(/<(br|\/p|\/div|\/h[1-6]|hr)\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

export function build(book: Book): Blob {
  const rule = '—'.repeat(40);
  const head = [
    book.title,
    book.author ? `Author: ${book.author}` : '',
    book.fandom ? `Fandom: ${book.fandom}` : '',
    (book.tags || []).length ? `Tags: ${book.tags.join(', ')}` : '',
    book.sourceUrl ? `Source: ${book.sourceUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const summary = book.summaryText ? `\n\n${book.summaryText}` : '';

  const body = (book.chapters || [])
    .map((c) => `\n\n${rule}\n${c.title}\n${rule}\n\n${stripTags(c.xhtml)}`)
    .join('\n');

  // BOM — without it Windows Notepad and some readers render Cyrillic as mojibake.
  return new Blob(['﻿', head, summary, body, '\n'], { type: 'text/plain;charset=utf-8' });
}

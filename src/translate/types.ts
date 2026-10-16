// An engine only moves HTML fragments between languages. Which fragments, and
// what becomes of the book afterwards, is book.ts's business — so a second
// engine is one file that implements this.

export interface TranslateResult {
  /** One translated string per input, in order, inline markup preserved. */
  texts: string[];
  /** The source language the engine detected for each input; '' where it did not say. */
  detected: string[];
}

export interface Translator {
  /** Technical identifier, for logic and tests — never shown to anyone. */
  id: string;
  /** `from` may be `auto`. Batching and pacing are the engine's own concern. */
  translate(htmlSegments: string[], from: string, to: string, signal?: AbortSignal): Promise<TranslateResult>;
}

export interface TranslateLanguage {
  code: string;
  /** The language's own name for itself — what a reader looks for in the list. */
  label: string;
}

export const LANGUAGES: TranslateLanguage[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Українська' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ko', label: '한국어' },
];

/** Anything that is not a known language code means "off". */
export function normalizeTarget(value: string | null | undefined): string {
  return LANGUAGES.some((l) => l.code === value) ? (value as string) : '';
}

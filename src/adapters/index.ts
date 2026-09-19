// The registry. Order matters: the first adapter whose `match` accepts the URL
// wins, and `generic` is the floor everything falls back to.
import type { Adapter } from '../types.ts';
import { ao3 } from './ao3.ts';
import { fanficsme } from './fanficsme.ts';
import { ffnet } from './ffnet.ts';
import { ficbook } from './ficbook.ts';
import { generic } from './generic.ts';
import { royalroad } from './royalroad.ts';
import { wattpad } from './wattpad.ts';

export const SITE_ADAPTERS: Adapter[] = [ficbook, ao3, fanficsme, ffnet, wattpad, royalroad];

export { ao3, fanficsme, ffnet, ficbook, generic, royalroad, wattpad };

export function resolveAdapter(url: string): Adapter {
  for (const adapter of SITE_ADAPTERS) {
    try {
      if (adapter.match(url)) return adapter;
    } catch {
      /* a malformed URL — just move on */
    }
  }
  return generic;
}

// The slice of the extension API this project actually uses. Hand-written on
// purpose: @types/chrome is thousands of lines describing APIs we never call,
// and "no dependencies" is a promise this repo keeps everywhere else too.
//
// If you reach for an API that is not here, add it here — do not widen to `any`.

declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }

  namespace storage {
    interface StorageArea {
      get<T extends Record<string, unknown>>(defaults: T, callback: (items: T) => void): void;
      set(items: Record<string, unknown>, callback?: () => void): void;
    }
    const sync: StorageArea;
    const local: StorageArea;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
    }
    function query(info: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
  }

  namespace scripting {
    interface InjectionTarget {
      tabId: number;
      allFrames?: boolean;
    }
    function executeScript(injection: {
      target: InjectionTarget;
      files?: string[];
      func?: () => void;
    }): Promise<unknown>;
  }
}

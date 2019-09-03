import { StoreData } from './types';

type EventTiming = { start: number; end: number };

type BalerDebugEvent =
    | { type: 'collectStoreData:start' }
    | {
          type: 'collectStoreData:end';
          storeData: StoreData;
          timing: EventTiming;
      }
    | { type: 'eligibleThemes'; payload: string[] }
    | {
          type: 'createBundle:start';
          themeID: string;
          bundleName: string;
          deps: string[];
      }
    | {
          type: 'invalidShims';
          themeID: string;
          deps: string[];
      }
    | {
          type: 'createBundle:end';
          themeID: string;
          bundleName: string;
          bundleSize: number;
          timing: EventTiming;
      };

type DebugEventHandler = (event: BalerDebugEvent) => void;

const events: BalerDebugEvent[] = [];

const handlers: Set<DebugEventHandler> = new Set();

/**
 * @summary Logs data that may be useful to a user of Baler.
 *          Currently surfaced via specific CLI flags
 */
export function debugEvent(event: BalerDebugEvent) {
    events.push(event);
    for (const handler of handlers) {
        handler(event);
    }
}

export function debugTimer(): () => EventTiming {
    const start = Date.now();
    return () => {
        const end = Date.now();
        return { start, end };
    };
}

/**
 * @summary Get a list of all debug events
 */
export function getEvents() {
    return events.slice();
}

/**
 * @summary Register a handler to be called whenever a new
 *          debug event is dispatched
 */
export function onDebugEvent(handler: DebugEventHandler) {
    handlers.add(handler);
    return () => {
        handlers.delete(handler);
    };
}

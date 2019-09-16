import { join } from 'path';
import { performance } from 'perf_hooks';
import { createWriteStream, WriteStream } from 'fs';

const IS_TEST = process.env.NODE_ENV === 'test';

/**
 * @summary Lazily initialize a write stream for a log file
 */
const getTraceFileStream = (() => {
    if (IS_TEST) return;

    const traceFile = join(process.cwd(), `baler-trace-${Date.now()}.txt`);
    let writeStream: WriteStream;

    return () => {
        if (!writeStream) {
            writeStream = createWriteStream(traceFile);
        }

        return writeStream;
    };
})();

/**
 * @summary Add a single event to the event trace log
 */
export function trace(event: string) {
    if (!tracingEnabled) return;

    const timeFromProcessStart = performance.now();
    if (getTraceFileStream) {
        getTraceFileStream().write(`(${timeFromProcessStart}): ${event}\n`);
    }
}

let tracingEnabled = false;
/**
 * @summary Enable baler event tracing for all executions
 *          in the current process
 */
export function enableTracing() {
    tracingEnabled = true;
}

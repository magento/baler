import { log } from './log';
import { join } from 'path';
import { promises as fs } from 'fs';
import { MagentoRequireConfig } from './types';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';

type AMDGraph = Record<string, string[]>;

/**
 * @summary Build a dependency graph of AMD modules, starting
 *          from a single entry module
 */
export async function traceAMDDependencies(
    entryModuleID: string,
    requireConfig: MagentoRequireConfig,
    baseDir: string,
): Promise<AMDGraph> {
    const resolver = createRequireResolver(requireConfig);
    const toVisit: Set<string> = new Set();
    const reads: Map<string, Promise<string>> = new Map();
    const graph: AMDGraph = {};

    const addDep = (dep: string) => {
        toVisit.add(dep);
        // the while loop processes things serially,
        // but we kick off file reads as soon as possible
        // so the file is ready when it's time to process
        const pendingRead = quietAsyncRejectionWarning(
            fs.readFile(join(baseDir, dep), 'utf8'),
        );
        reads.set(dep, pendingRead);
    };

    // Manually add the entry point
    addDep(resolver(entryModuleID));
    log.debug(`Begin tracing AMD dependencies, starting with ${entryModuleID}`);

    // Breadth-first search of the graph
    while (toVisit.size) {
        const [resolvedID] = toVisit;
        toVisit.delete(resolvedID);
        log.debug(`Tracing dependencies for "${resolvedID}"`);

        const source = (await reads.get(resolvedID)) as string;
        const { deps } = parseJavaScriptDeps(source);
        graph[resolvedID] = [];

        deps.forEach(dep => {
            const resolvedDepID = resolver(dep, resolvedID);
            graph[resolvedID].push(resolvedDepID);
            log.debug(`Found dependency "${resolvedDepID}" in ${resolvedID}`);
            if (!graph.hasOwnProperty(resolvedDepID)) {
                addDep(resolvedDepID);
            }
        });
    }

    return graph;
}

/**
 * @summary Unfortunately a decision was made in node.js core
 *          to spit warnings to stdout whenever a rejection
 *          handler has not been added synchronously to a promise,
 *          which is a pain when you're saving promises to be unwrapped.
 *          This opts-in to stopping those warnings on a per-promise basis
 * @see https://github.com/rsp/node-caught
 */
function quietAsyncRejectionWarning<T>(promise: Promise<T>) {
    promise.catch(() => {});
    return promise;
}

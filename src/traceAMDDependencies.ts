import { log } from './log';
import { extname } from 'path';
import { promises as fs } from 'fs';
import { wrapP } from './wrapP';
import { resolvedModuleIDToPath } from './resolvedModuleIDToPath';
import { parseModuleID } from './parseModuleID';
import { MagentoRequireConfig } from './types';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';

type AMDGraph = Record<string, string[]>;
type CacheEntry = {
    read: Promise<string>;
    path: string;
};

const BUILT_IN_DEPS = ['exports', 'require', 'module'];

/**
 * @summary Build a dependency graph of AMD modules, starting
 *          from a single entry module
 * @todo Implement support for mixins
 */
export async function traceAMDDependencies(
    entryModuleID: string,
    requireConfig: MagentoRequireConfig,
    baseDir: string,
): Promise<AMDGraph> {
    const resolver = createRequireResolver(requireConfig);
    const toVisit: Set<string> = new Set();
    const moduleCache: Map<string, CacheEntry> = new Map();
    const graph: AMDGraph = {};

    const addDependencyToGraph = (resolvedDepID: string) => {
        if (graph.hasOwnProperty(resolvedDepID)) return;
        graph[resolvedDepID] = [];

        const path = resolvedModuleIDToPath(resolvedDepID, baseDir);
        // We're only tracing AMD dependencies. Since a non-JS file
        // can't have dependencies, we can skip the read and parse
        if (extname(path) !== '.js') {
            return;
        }

        toVisit.add(resolvedDepID);
        // the while loop processes things serially,
        // but we kick off file reads as soon as possible
        // so the file is ready when it's time to process
        const read = quietAsyncRejectionWarning(fs.readFile(path, 'utf8'));
        moduleCache.set(resolvedDepID, {
            read,
            path,
        });
    };

    log.debug(`Begin tracing AMD dependencies`);
    // Manually add the entry point
    addDependencyToGraph(entryModuleID);

    // Breadth-first search of the graph
    while (toVisit.size) {
        const [resolvedID] = toVisit;
        toVisit.delete(resolvedID);
        log.debug(`Tracing dependencies for "${resolvedID}"`);

        const { read } = moduleCache.get(resolvedID) as CacheEntry;
        const [err, source] = await wrapP(read);
        if (err) {
            throw decorateReadErrorMessage(resolvedID, err);
        }

        const { deps } = parseJavaScriptDeps(source as string);
        if (deps.length) {
            log.debug(`Found dependency request for: ${deps.join(', ')}`);
        }

        deps.forEach(dep => {
            if (BUILT_IN_DEPS.includes(dep)) {
                // We want data about built-in dependencies in the graph,
                // but we don't want to try to read them from disk, since
                // they come from the require runtime
                graph[resolvedID].push(dep);
                return;
            }

            const { id, plugin } = parseModuleID(dep);

            if (id) {
                const resolvedDepID = resolver(id, resolvedID);
                graph[resolvedID].push(resolvedDepID);
                addDependencyToGraph(resolvedDepID);
            }

            if (plugin) {
                const resolvedPluginID = resolver(plugin);
                graph[resolvedID].push(resolvedPluginID);
                addDependencyToGraph(resolvedPluginID);
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

function decorateReadErrorMessage(
    moduleID: string,
    err: NodeJS.ErrnoException,
) {
    const strBuilder: string[] = [
        'Failed reading an AMD module from disk.\n',
        `  ID: "${moduleID}"\n`,
        `  Path: "${err.path}"\n`,
        `  Code: "${err.code}"`,
    ];
    err.message = strBuilder.join('');
    return err;
}

import { log } from './log';
import { extname } from 'path';
import { readFile } from './fsPromises';
import { wrapP } from './wrapP';
import { resolvedModuleIDToPath } from './resolvedModuleIDToPath';
import { parseModuleID } from './parseModuleID';
import {
    MagentoRequireConfig,
    AMDGraph,
    TraceResult,
    UnreadableDependencyWarning,
} from './types';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';
import { getMixinsForModule } from './requireConfig';
import { REQUIRE_BUILT_INS } from './requireBuiltIns';

type CacheEntry = {
    read: Promise<string>;
    path: string;
    issuer: string;
};

/**
 * @summary Build a dependency graph of AMD modules, starting
 *          from a single entry module
 * @todo Implement shim support
 */
export async function traceAMDDependencies(
    entryModuleIDs: string[],
    requireConfig: MagentoRequireConfig,
    baseDir: string,
): Promise<TraceResult> {
    const resolver = createRequireResolver(requireConfig);
    const toVisit: Set<string> = new Set();
    const moduleCache: Map<string, CacheEntry> = new Map();
    const graph: AMDGraph = {};
    const warnings: TraceResult['warnings'] = [];

    const addDependencyToGraph = (resolvedDepID: string, issuer: string) => {
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
        const read = quietAsyncRejectionWarning(readFile(path, 'utf8'));
        moduleCache.set(resolvedDepID, {
            read,
            path,
            issuer,
        });
    };

    const resolvedEntryIDs: string[] = [];
    // Seed the visitors list with entry points
    entryModuleIDs.forEach(entryID => {
        const { id, plugin } = parseModuleID(entryID);
        if (id) {
            const resolvedEntryID = resolver(id);
            resolvedEntryIDs.push(resolvedEntryID);
            addDependencyToGraph(resolvedEntryID, '<entry point>');
        }

        if (plugin) {
            const resolvedEntryID = resolver(plugin);
            resolvedEntryIDs.push(resolvedEntryID);
            addDependencyToGraph(resolvedEntryID, '<entry point>');
        }
    });

    // Breadth-first search of the graph
    while (toVisit.size) {
        const [resolvedID] = toVisit;
        toVisit.delete(resolvedID);
        log.debug(`Preparing to read + parse "${resolvedID}"`);

        const { read, path, issuer } = moduleCache.get(
            resolvedID,
        ) as CacheEntry;
        const [err, source] = await wrapP(read);
        if (err) {
            // Missing files are treated as warnings, rather than hard errors, because
            // a storefront is still usable (will just take a perf hit)
            warnings.push(
                unreadableDependencyWarning(resolvedID, path, issuer),
            );
            log.debug(`Warning for missing dependency "${resolvedID}"`);
            continue;
        }

        const { deps } = parseJavaScriptDeps(source as string);
        if (deps.length) {
            log.debug(`Found dependency request for: ${deps.join(', ')}`);
        }

        const mixins = getMixinsForModule(resolvedID, requireConfig).map(
            mixin => resolver(mixin),
        );

        mixins.forEach(mixin => {
            const resolvedMixinID = resolver(mixin);
            graph[resolvedID].push(resolvedMixinID);
            addDependencyToGraph(resolvedMixinID, '<mixin>');
        });

        deps.forEach(dep => {
            if (REQUIRE_BUILT_INS.includes(dep)) {
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
                addDependencyToGraph(resolvedDepID, resolvedID);
            }

            if (plugin) {
                const resolvedPluginID = resolver(plugin);
                graph[resolvedID].push(resolvedPluginID);
                addDependencyToGraph(resolvedPluginID, resolvedID);
            }
        });
    }

    return { graph, warnings, resolvedEntryIDs };
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

function unreadableDependencyWarning(
    resolvedID: string,
    path: string,
    issuer: string,
): UnreadableDependencyWarning {
    return {
        type: 'UnreadableDependencyWarning',
        resolvedID,
        path,
        issuer,
    };
}

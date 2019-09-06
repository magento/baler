import { trace } from './trace';
import { extname, join } from 'path';
import { readFile } from './fsPromises';
import { wrapP } from './wrapP';
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

    const addDependencyToGraph = (
        moduleID: string,
        modulePath: string,
        issuer: string,
    ) => {
        if (graph.hasOwnProperty(moduleID)) return;
        graph[moduleID] = [];

        const path = join(baseDir, modulePath);
        // We're only tracing AMD dependencies. Since a non-JS file
        // can't have dependencies, we can skip the read and parse
        if (extname(path) !== '.js') {
            return;
        }

        toVisit.add(moduleID);
        // the while loop processes things serially,
        // but we kick off file reads as soon as possible
        // so the file is ready when it's time to process
        const read = quietAsyncRejectionWarning(readFile(path, 'utf8'));
        moduleCache.set(moduleID, {
            read,
            path,
            issuer,
        });
    };

    const resolvedEntryIDs: string[] = [];
    // Seed the visitors list with entry points
    entryModuleIDs.forEach(entryID => {
        const resolved = resolver(entryID);
        resolvedEntryIDs.push(resolved.moduleID);
        addDependencyToGraph(
            resolved.moduleID,
            resolved.modulePath,
            '<entry point>',
        );

        if (resolved.pluginID) {
            addDependencyToGraph(
                resolved.pluginID,
                resolved.pluginPath,
                resolved.moduleID,
            );
        }
    });

    // Breadth-first search of the graph
    while (toVisit.size) {
        const [moduleID] = toVisit;
        toVisit.delete(moduleID);
        trace(`Preparing to read + parse "${moduleID}"`);

        const { read, path, issuer } = moduleCache.get(moduleID) as CacheEntry;
        const [err, source] = await wrapP(read);
        if (err) {
            // Missing files are treated as warnings, rather than hard errors, because
            // a storefront is still usable (will just take a perf hit)
            warnings.push(unreadableDependencyWarning(moduleID, path, issuer));
            trace(`Warning for missing dependency "${moduleID}"`);
            continue;
        }

        const { deps } = parseJavaScriptDeps(source as string);
        if (deps.length) {
            trace(`Found dependency request for: ${deps.join(', ')}`);
        }

        const mixins = getMixinsForModule(moduleID, requireConfig).map(
            mixin => resolver(mixin).moduleID,
        );

        mixins.forEach(mixin => {
            const resolvedMixin = resolver(mixin);
            graph[moduleID].push(resolvedMixin.moduleID);
            addDependencyToGraph(
                resolvedMixin.moduleID,
                resolvedMixin.modulePath,
                '<mixin>',
            );
        });

        deps.forEach(dep => {
            if (REQUIRE_BUILT_INS.includes(dep)) {
                // We want data about built-in dependencies in the graph,
                // but we don't want to try to read them from disk, since
                // they come from the require runtime
                graph[moduleID].push(dep);
                return;
            }

            const result = resolver(dep, moduleID);
            // It's possible for a dependency to be a plugin without an argument.
            // Example: "domReady!"
            if (result.moduleID) {
                graph[moduleID].push(result.moduleID);
                addDependencyToGraph(
                    result.moduleID,
                    result.modulePath,
                    moduleID,
                );
            }

            if (result.pluginID) {
                graph[moduleID].push(result.pluginID);
                addDependencyToGraph(
                    result.pluginID,
                    result.pluginPath,
                    result.moduleID,
                );
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

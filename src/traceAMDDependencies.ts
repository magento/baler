/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

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
    const visitQueue: Set<string> = new Set();
    const moduleCache: Map<string, CacheEntry> = new Map();
    const graph: AMDGraph = {};
    const warnings: TraceResult['warnings'] = [];

    const queueDependency = (
        moduleID: string,
        modulePath: string,
        issuer: string,
    ) => {
        if (graph.hasOwnProperty(moduleID)) {
            // If we've already seen this dependency, skip it
            return;
        }

        // Add empty entry to dependency graph
        graph[moduleID] = [];

        const path = join(baseDir, modulePath);
        if (extname(path) !== '.js') {
            // We're only tracing AMD dependencies. Since a non-JS file
            // can't have dependencies, we can skip the read and parse
            return;
        }

        visitQueue.add(moduleID);
        // the while loop used for BFS in this module processes things serially,
        // but we kick off file reads as soon as possible so the file is ready
        // when it's time to process
        const read = quietAsyncRejectionWarning(readFile(path, 'utf8'));
        moduleCache.set(moduleID, {
            read,
            path,
            issuer,
        });
    };

    const resolvedEntryIDs: string[] = [];
    // Seed the visitors list with entry points to start
    // the graph traversal with
    entryModuleIDs.forEach(entryID => {
        const resolved = resolver(entryID);
        resolvedEntryIDs.push(resolved.moduleID);
        queueDependency(
            resolved.moduleID,
            resolved.modulePath,
            '<entry point>',
        );

        if (resolved.pluginID) {
            queueDependency(
                resolved.pluginID,
                resolved.pluginPath,
                resolved.moduleID,
            );
        }
    });

    // Breadth-first search of the graph
    while (visitQueue.size) {
        const [moduleID] = visitQueue;
        visitQueue.delete(moduleID);
        trace(`Preparing to analyze "${moduleID}" for dependencies`);

        const { read, path, issuer } = moduleCache.get(moduleID) as CacheEntry;
        const [err, source] = await wrapP(read);
        if (err) {
            // Missing files are treated as warnings, rather than hard errors, because
            // a storefront is still usable (will just fall back to the network and
            // take a perf hit)
            warnings.push(unreadableDependencyWarning(moduleID, path, issuer));
            trace(
                `Warning for missing dependency "${moduleID}", which was required by "${issuer}"`,
            );
            continue;
        }

        const { deps } = parseJavaScriptDeps(source as string);
        if (deps.length) {
            trace(
                `Discovered dependencies for "${moduleID}": ${deps.join(', ')}`,
            );
        }

        // TODO: test coverage for mixins
        const mixins = getMixinsForModule(moduleID, requireConfig).map(
            mixin => resolver(mixin).moduleID,
        );

        mixins.forEach(mixin => {
            const resolvedMixin = resolver(mixin);
            graph[moduleID].push(resolvedMixin.moduleID);
            queueDependency(
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
            // It's possible for a dependency to be a plugin without an associated
            // resource. Example: "domReady!"
            if (result.moduleID) {
                graph[moduleID].push(result.moduleID);
                queueDependency(result.moduleID, result.modulePath, moduleID);
            }

            if (result.pluginID) {
                graph[moduleID].push(result.pluginID);
                queueDependency(
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

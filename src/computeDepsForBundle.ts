import { AMDGraph } from './types';

/**
 * @summary Given an ordered list of entry points and a graph,
 *          will return an ordered list of dependencies to bundle,
 *          ordered depth-first to match the runtime execution
 *          order of AMD modules
 */
export function computeDepsForBundle(graph: AMDGraph, entryPoints: string[]) {
    const depsToBundle: Set<string> = new Set();
    const toVisit: string[] = [...entryPoints];

    while (toVisit.length) {
        const dep = toVisit.shift() as string;
        // Break cycle
        if (depsToBundle.has(dep)) {
            continue;
        }

        depsToBundle.add(dep);

        const directDeps = graph[dep];
        if (directDeps && directDeps.length) {
            toVisit.unshift(...directDeps);
        }
    }

    return Array.from(depsToBundle);
}

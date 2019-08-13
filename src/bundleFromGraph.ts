import { AMDGraph } from './types';

type BundleResult = {
    dependencies: string[];
    result: string;
    sourcemap: string;
};

export async function bundleFromGraph(
    magentoRoot: string,
    graph: AMDGraph,
    entryPoints: string[],
) {
    const depsForBundle = getDependenciesDepthFirst(graph, entryPoints);
    console.log(depsForBundle);
}

/**
 * @summary Given an ordered list of entry points and a graph,
 *          will return an ordered list of dependencies to bundle,
 *          ordered depth-first to match the runtime execution
 *          order of AMD modules
 */
function getDependenciesDepthFirst(graph: AMDGraph, entryPoints: string[]) {
    console.log(entryPoints);
    const depsToBundle: Set<string> = new Set();
    const entries = [...entryPoints];
    const toVisit: string[] = [entries.shift() as string];

    while (toVisit.length) {
        const dep = toVisit.shift() as string;
        // Add current dependency to bundle list
        depsToBundle.add(dep);
        const directDeps = graph[dep];
        // Add direct dependencies to list to be visited
        if (directDeps && directDeps.length) {
            toVisit.unshift(...directDeps);
        }

        if (!toVisit.length && entries.length) {
            toVisit.unshift(entries.shift() as string);
        }
    }

    return Array.from(depsToBundle);
}

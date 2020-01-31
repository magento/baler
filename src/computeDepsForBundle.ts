/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import { AMDGraph } from './types';
import { REQUIRE_BUILT_INS } from './requireBuiltIns';

/**
 * @summary Given an ordered list of entry points and a graph,
 *          will return an ordered list of dependencies to bundle,
 *          ordered depth-first to match the runtime execution
 *          order of AMD modules. Excludes any modules that are built-in
 *          to require
 */
export function computeDepsForBundle(graph: AMDGraph, entryPoints: string[]) {
    const depsToBundle: Set<string> = new Set();
    const toVisit: string[] = [...entryPoints];

    while (toVisit.length) {
        const dep = toVisit.shift() as string;
        // Break cycle
        if (depsToBundle.has(dep) || REQUIRE_BUILT_INS.includes(dep)) {
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

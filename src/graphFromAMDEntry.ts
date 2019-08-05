import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';
import { MagentoRequireConfig } from './types';
import { createDependencyGraph } from './createDependencyGraph';

export async function graphFromAMDEntry(
    magentoRoot: string,
    baseDir: string,
    entryModuleID: string,
    requireConfig: MagentoRequireConfig,
) {
    const resolver = createRequireResolver(requireConfig, baseDir);
    return addToGraph(magentoRoot, resolver, entryModuleID);
}

async function addToGraph(
    magentoRoot: string,
    resolver: ReturnType<typeof createRequireResolver>,
    moduleID: string,
    parentPath: string = '',
    graph: ReturnType<typeof createDependencyGraph> = createDependencyGraph(),
) {
    // handle when relative paths are used instead of module ids
    // TODO: move to require resolver
    const modulePath = moduleID.startsWith('.')
        ? `${join(dirname(parentPath), moduleID)}.js`
        : resolver(moduleID);

    const source = await fs.readFile(join(magentoRoot, modulePath), 'utf8');
    const results = parseJavaScriptDeps(source);

    // HACK TO REMOVE:
    results.deps = results.deps.filter(d => !d.endsWith('!'));

    graph.addAMDDependency({
        requireID: moduleID,
        deps: results.deps,
        isEntry: !parentPath,
    });

    if (!results.deps.length) {
        return graph;
    }

    await Promise.all(
        results.deps.map(dep => {
            return addToGraph(magentoRoot, resolver, dep, modulePath, graph);
        }),
    );

    return graph;
}

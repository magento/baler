import { join } from 'path';
import { promises as fs } from 'fs';
import { MagentoRequireConfig } from './types';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';

type AMDGraph = Record<string, string[]>;

export async function traceAMDDependencies(
    moduleID: string,
    requireConfig: MagentoRequireConfig,
    baseDir: string,
): Promise<AMDGraph> {
    const resolver = createRequireResolver(requireConfig);
    const resolvedID = resolver(moduleID);
    const toVisit: Set<string> = new Set([resolvedID]);
    const parents: Map<string, string> = new Map();
    const graph: AMDGraph = {};

    while (toVisit.size) {
        const [next] = toVisit;
        toVisit.delete(next);
        const parentPath = parents.get(next);

        const source = await readAMDModule(next, baseDir, parentPath);
        const { deps } = parseJavaScriptDeps(source);
        graph[next] = [];

        deps.forEach(dep => {
            const resolvedID = resolver(dep, next);
            graph[next].push(resolvedID);
            if (!graph.hasOwnProperty(resolvedID)) {
                toVisit.add(resolvedID);
                parents.set(resolvedID, next);
            }
        });
    }

    return graph;
}

async function readAMDModule(
    moduleID: string,
    baseDir: string,
    parentPath?: string,
) {
    const path = join(baseDir, moduleID);
    try {
        const result = await fs.readFile(path, 'utf8');
        return result;
    } catch {
        const strBuilder = [
            'Could not find required dependency',
            `  ID: ${moduleID}`,
            parentPath && `  Required By: ${parentPath}`,
            `  Expected path: ${path}`,
        ];

        throw new Error(strBuilder.join('\n'));
    }
}

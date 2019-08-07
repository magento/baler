import { log } from './log';
import { join } from 'path';
import { promises as fs } from 'fs';
import { MagentoRequireConfig } from './types';
import { parseJavaScriptDeps } from './parseJavaScriptDeps';
import { createRequireResolver } from './createRequireResolver';

type AMDGraph = Record<string, string[]>;

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
        const pendingRead = fs.readFile(join(baseDir, dep), 'utf8');
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

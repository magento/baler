import { Dependency } from './types';

class DependencyGraph {
    // Graph is represented with IDs, rather than references, to prevent
    // circular deps that would make serialization a PITA
    private graph: Readonly<Record<string, ReadonlyArray<string>>> = {};
    private dependencies: Readonly<Record<string, Dependency>> = {};
    private entries: ReadonlyArray<string> = [];

    /**
     * @summary Add a new PHTML file dependency. PHTML
     *          files are always considered an entry point
     */
    addPHTMLDependency({ path, deps }: { path: string; deps: string[] }) {
        const { dependencies, graph, entries } = this;

        if (this.hasDep(path)) {
            throw new Error(
                `PHTML Dependency "${path}" was already added to the graph`,
            );
        }

        this.graph = immutAddProp(graph, path, deps);
        this.dependencies = immutAddProp(dependencies, path, {
            type: 'PHTMLDependency',
            pathFromStoreRoot: path,
        });
        this.entries = [...entries, path];

        return this;
    }

    /**
     * @summary Add a new AMD module dependency, optionally
     *          marking it as an entry point
     */
    addAMDDependency({
        requireID,
        deps,
        isEntry,
    }: {
        requireID: string;
        deps: string[];
        isEntry?: boolean;
    }) {
        const { dependencies, graph, entries } = this;

        if (this.hasDep(requireID)) {
            throw new Error(
                `AMD Dependency "${requireID}" was already added to the graph`,
            );
        }

        this.graph = immutAddProp(graph, requireID, deps);
        this.dependencies = immutAddProp(dependencies, requireID, {
            type: 'AMDDependency',
            requireID,
        });

        if (isEntry) {
            this.entries = [...entries, requireID];
        }

        return this;
    }

    private hasDep(key: string) {
        return this.dependencies.hasOwnProperty(key);
    }

    // TODO: Add support for deserialization
    toJSON() {
        const { graph, dependencies, entries } = this;
        return {
            graph,
            dependencies,
            entries,
        };
    }

    /**
     * @summary Generate a GraphViz DOT representation of the
     *          dependency graph
     */
    toDOTGraph() {
        const strBuilder = ['digraph {'];
        for (const [id, deps] of Object.entries(this.graph)) {
            strBuilder.push(...deps.map(d => `  "${id}" -> "${d}"`));
        }
        for (const entry of this.entries) {
            strBuilder.push(
                `  "${entry}" [shape=square, style=filled, fillcolor=orange]`,
            );
        }
        strBuilder.push('}');
        return strBuilder.join('\n');
    }
}

function immutAddProp<T, K extends keyof T>(obj: T, key: K, val: T[K]): T {
    return {
        ...obj,
        [key]: val,
    };
}

export const createDependencyGraph = () => new DependencyGraph();

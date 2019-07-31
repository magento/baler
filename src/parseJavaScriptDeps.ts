import * as acorn from 'acorn';
import { Program, SimpleCallExpression, ArrayExpression } from 'estree';
import * as esquery from 'esquery';

export function parseJavaScriptDeps(input: string) {
    const ast = (acorn.parse(input) as any) as Program;
    const defineDeps = getAMDDefineDeps(ast);

    return defineDeps;
}

function getAMDDefineDeps(ast: Program) {
    const selector = 'CallExpression[callee.name=define]';
    const defineCalls = esquery.query(ast, selector) as SimpleCallExpression[];
    const deps: string[] = [];

    for (const call of defineCalls) {
        const [firstArg, secondArg] = call.arguments;

        // Anonymous AMD module with dependencies
        if (firstArg.type === 'ArrayExpression') {
            deps.push(...extractDepsFromArrayExpression(firstArg).deps);
        }
        // Named AMD module with dependencies
        if (secondArg.type === 'ArrayExpression') {
            deps.push(...extractDepsFromArrayExpression(secondArg).deps);
        }
    }

    return deps;
}

function extractDepsFromArrayExpression(node: ArrayExpression) {
    const deps: string[] = [];
    let incompleteAnalysis = false;

    for (const e of node.elements) {
        if (e.type === 'Literal' && typeof e.value === 'string') {
            deps.push(e.value);
        } else {
            incompleteAnalysis = true;
        }
    }

    return { deps, incompleteAnalysis };
}

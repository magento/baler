import * as acorn from 'acorn';
import * as acornLoose from 'acorn-loose';
import { Program, SimpleCallExpression, ArrayExpression } from 'estree';
import * as esquery from 'esquery';
import { ParserResult } from './types';

/**
 * @summary Statically analyze a JavaScript file for all
 *          declared dependencies. Supports:
 *          - AMD `define` calls with deps array
 *          - AMD `require` calls with deps array
 * @param fromPHP If true, will use a loose parser that can better
 *                handle PHP interpolations in the code
 */
export function parseJavaScriptDeps(
    input: string,
    fromPHP?: boolean,
): ParserResult {
    const parse = (fromPHP ? acornLoose : acorn).parse;
    const ast = (parse(input) as any) as Program;
    const defineData = getAMDDefineDeps(ast);
    const requireData = getAMDRequireDeps(ast);

    return {
        deps: [...defineData.deps, ...requireData.deps],
        incompleteAnalysis:
            defineData.incompleteAnalysis || requireData.incompleteAnalysis,
    };
}

/**
 * @summary Statically analyze dependencies for AMD `define` calls.
 *          Supports both named and anonymous modules
 */
function getAMDDefineDeps(ast: Program) {
    const selector = 'CallExpression[callee.name=define]';
    const defineCalls = esquery.query(ast, selector) as SimpleCallExpression[];
    let incompleteAnalysis = false;
    const deps: string[] = [];

    for (const call of defineCalls) {
        const [firstArg, secondArg] = call.arguments;

        // Anonymous AMD module with dependencies
        if (firstArg && firstArg.type === 'ArrayExpression') {
            const results = extractDepsFromArrayExpression(firstArg);
            deps.push(...results.deps);
            if (results.incompleteAnalysis) incompleteAnalysis = true;
        }
        // Named AMD module with dependencies
        if (secondArg && secondArg.type === 'ArrayExpression') {
            const results = extractDepsFromArrayExpression(secondArg);
            deps.push(...results.deps);
            if (results.incompleteAnalysis) incompleteAnalysis = true;
        }
    }

    return { deps, incompleteAnalysis };
}

/**
 * @summary Statically analyze dependencies for AMD `require` calls.
 *          Supports the following forms:
 *          - require(['dep'], function(dep) {})
 *          - require('dep')
 *          - require(['dep']);
 */
function getAMDRequireDeps(ast: Program) {
    const selector = 'CallExpression[callee.name=require]';
    const requireCalls = esquery.query(ast, selector) as SimpleCallExpression[];
    let incompleteAnalysis = false;
    const deps: string[] = [];

    for (const call of requireCalls) {
        const [firstArg] = call.arguments;
        // Empty define or require call is likely a user-error,
        // but can ignore when bundling
        if (!firstArg) continue;

        // async require
        if (firstArg.type === 'ArrayExpression') {
            const results = extractDepsFromArrayExpression(firstArg);
            deps.push(...results.deps);
            if (results.incompleteAnalysis) incompleteAnalysis = true;
        }

        // sync require
        if (firstArg.type === 'Literal') {
            if (typeof firstArg.value !== 'string') {
                incompleteAnalysis = true;
                continue;
            }
            deps.push(firstArg.value);
        }
    }

    return { deps, incompleteAnalysis };
}

/**
 * @summary Statically analzye dependencies in an array literal.
 *          Marks as "incompleteAnalysis" for any dep that is not a string literal
 */
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

import vm from 'vm';
import { readFileSync } from 'fs';
import { parse, join } from 'path';

// The whole point of this module is to piggy back on
// RequireJS's path resolver so we don't have to reimplement
// it. Unfortunately the lib is not CommonJS or ES module friendly,
// so we have to use some hacks.

// We're making an (admittedly large) assumption here that Require's
// ID resolving logic hasn't changed between versions used across
// various Magento releases
const requirejs = readFileSync(require.resolve('requirejs/require.js'), 'utf8');

export type Resolver = (id: string) => string;
/**
 * @summary Create a file path resolver using the API exposed by RequireJS,
 *          taking into account paths/map/etc config
 */
export function createRequireResolver(
    requireConfig: RequireConfig,
    baseDir: string,
) {
    const sandbox = {};
    // RequireJS is targeted at browsers, so it doesn't
    // have a CommonJS version, and just sets a global.
    // This is a quick hack to get what we need off that global
    vm.runInNewContext(requirejs, sandbox);
    // @ts-ignore
    sandbox.require.config({ ...requireConfig, baseUrl: '' });
    const toUrl = (sandbox as any).require.s.contexts._.require.toUrl as (
        name: string,
        ext?: string,
    ) => string;

    const resolver = (id: string) => {
        const parts = parse(id);
        const knownExt = parts.ext === '.js' || parts.ext === '.html';
        const rel: string = toUrl(id);
        const joined = join(baseDir, rel);
        return knownExt ? joined : `${joined}.js`;
    };

    return resolver;
}

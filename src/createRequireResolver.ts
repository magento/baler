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
    const nameToUrl = (sandbox as any).require.s.contexts._.nameToUrl as (
        name: string,
        ext?: string,
    ) => string;

    const resolver = (id: string) => {
        const parts = parse(id);
        const knownExt = parts.ext === '.js' || parts.ext === '.html';
        // Some of the crazyness below is to deal with module names
        // that appear to include extensions, like jquery.mobile.custom
        const rel: string = nameToUrl(
            join(parts.dir, knownExt ? parts.name : parts.base),
            knownExt ? parts.ext : '.js',
        );
        return join(baseDir, rel);
    };

    return resolver;
}
